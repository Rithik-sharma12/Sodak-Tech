"""Score computation.

SODAK-TECH-DESIGN.md §3.5 defines score as a pure function of stored results:

    raw    = sum(weight of fully-passed test groups) / sum(all weights)
    final  = raw x editorial_multiplier x hint_multiplier

Keeping it pure is the point. Principle 4 warns that "a stored final score that
cannot be recomputed is unrecoverable when the rubric is wrong", and principle 6
guarantees a wrong test case will ship. Everything below takes stored rows and
a rubric and returns a number; it reads no clock and no request state.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings

TWO_PLACES = Decimal("0.01")


@dataclass(frozen=True)
class ScoreBreakdown:
    """The inputs and the output together, so a score can be explained.

    Returned rather than just the number because "why did I get 60?" is a
    support question that otherwise requires a database session to answer.
    """

    raw: Decimal
    final: Decimal
    earned_weight: int
    total_weight: int
    editorial_multiplier: Decimal
    hint_multiplier: Decimal

    def as_dict(self) -> dict[str, object]:
        return {
            "raw": str(self.raw),
            "final": str(self.final),
            "earned_weight": self.earned_weight,
            "total_weight": self.total_weight,
            "editorial_multiplier": str(self.editorial_multiplier),
            "hint_multiplier": str(self.hint_multiplier),
        }


def _multipliers(rubric: dict) -> tuple[Decimal, Decimal]:
    """Read multipliers from the pinned rubric, falling back to settings.

    The rubric is stored on the problem version, so a submission judged last
    year rescores with last year's multipliers even if the platform default has
    since changed. That is what "pinned" has to mean to be worth anything.
    """
    editorial = rubric.get("editorial_multiplier", settings.EDITORIAL_SCORE_MULTIPLIER)
    hint = rubric.get("hint_multiplier", settings.HINT_SCORE_MULTIPLIER)
    return Decimal(str(editorial)), Decimal(str(hint))


def compute_score(
    results,  # noqa: ANN001 -- iterable of SubmissionResult
    *,
    rubric: dict | None = None,
    editorial_viewed: bool = False,
    hint_used: bool = False,
    max_score: int = 100,
) -> ScoreBreakdown:
    """Compute a submission's score from its stored per-group results.

    A group contributes its full weight or nothing. §3.5: partial credit is per
    group, not per case, because group weights "encode meaning ('handles empty
    input') rather than an arbitrary fraction" -- and half of "handles empty
    input" is not a meaningful quantity.
    """
    rubric = rubric or {}

    total_weight = 0
    earned_weight = 0
    for result in results:
        total_weight += result.weight
        if result.passed:
            earned_weight += result.weight

    if total_weight == 0:
        # A version with no test groups scores zero rather than dividing by
        # zero. Publishing such a version should be blocked upstream; this is
        # the backstop.
        zero = Decimal("0.00")
        return ScoreBreakdown(zero, zero, 0, 0, Decimal("1"), Decimal("1"))

    raw = Decimal(earned_weight) / Decimal(total_weight)

    editorial_mult, hint_mult = _multipliers(rubric)
    applied_editorial = editorial_mult if editorial_viewed else Decimal("1")
    applied_hint = hint_mult if hint_used else Decimal("1")

    final = raw * applied_editorial * applied_hint * Decimal(max_score)

    return ScoreBreakdown(
        raw=(raw * Decimal(max_score)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
        final=final.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
        earned_weight=earned_weight,
        total_weight=total_weight,
        editorial_multiplier=applied_editorial,
        hint_multiplier=applied_hint,
    )


def overall_verdict(results, *, expected_group_count: int) -> str:  # noqa: ANN001
    """Derive the headline verdict from per-group results.

    Reports the first failure in group order rather than the most severe one.
    A user fixing their solution works through failures in order, so the first
    is the actionable one; showing the worst would make them chase a later bug
    while an earlier one still fails.
    """
    from apps.submissions.models import Verdict

    materialised = list(results)

    if len(materialised) < expected_group_count:
        # Fewer results than groups means judging did not finish. Saying
        # "accepted" here would be a fairness incident.
        return Verdict.INTERNAL_ERROR

    if all(r.passed for r in materialised):
        return Verdict.ACCEPTED

    for result in materialised:
        if not result.passed:
            return result.verdict

    return Verdict.WRONG_ANSWER


def rescore_submission(submission) -> ScoreBreakdown:  # noqa: ANN001
    """Recompute and persist a submission's score from its stored results.

    This is the operation principle 6 requires to exist as a first-class thing:
    after a bad test case is corrected and results are re-collected, scores are
    reconciled by calling this, not by hand-editing rows.
    """
    from apps.progress.models import UserProblemProgress

    progress = UserProblemProgress.objects.filter(
        user=submission.user, problem=submission.problem
    ).first()

    breakdown = compute_score(
        submission.results.select_related("test_group").all(),
        rubric=submission.problem_version.rubric,
        editorial_viewed=bool(progress and progress.editorial_viewed_at),
        hint_used=bool(progress and progress.hint_used),
    )

    submission.raw_score = breakdown.raw
    submission.score = breakdown.final
    submission.save(update_fields=["raw_score", "score", "updated_at"])
    return breakdown
