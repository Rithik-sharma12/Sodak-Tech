"""Tests for score computation.

These pin down §3.5 of the design doc, which is the part most likely to be
"simplified" later by someone who has not read it -- particularly that partial
credit is per group and that a group is all-or-nothing.
"""

from decimal import Decimal

import pytest

from apps.submissions.scoring import compute_score, overall_verdict


class FakeResult:
    """Minimal stand-in for SubmissionResult.

    compute_score reads only `weight` and `passed`, so the tests do not need a
    database. That is a property worth keeping: a scoring function that needs
    a database is a scoring function that cannot be exhaustively tested.
    """

    def __init__(self, weight: int, passed: bool, verdict: str = "wrong_answer") -> None:
        self.weight = weight
        self.passed = passed
        self.verdict = verdict


def test_all_groups_passed_scores_full_marks():
    results = [FakeResult(1, True), FakeResult(2, True), FakeResult(3, True)]
    breakdown = compute_score(results)

    assert breakdown.final == Decimal("100.00")
    assert breakdown.earned_weight == 6
    assert breakdown.total_weight == 6


def test_no_groups_passed_scores_zero():
    results = [FakeResult(1, False), FakeResult(2, False)]
    breakdown = compute_score(results)

    assert breakdown.final == Decimal("0.00")
    assert breakdown.earned_weight == 0


def test_partial_credit_is_weighted_by_group():
    """Weights encode meaning, so a heavy group is worth more than a light one."""
    results = [FakeResult(1, True), FakeResult(3, False)]
    breakdown = compute_score(results)

    # 1 of 4 weight earned, not 1 of 2 groups.
    assert breakdown.final == Decimal("25.00")


def test_group_is_all_or_nothing():
    """§3.5: partial credit is per group, never per case within a group.

    A group that failed one case contributes zero, no matter how many of its
    cases passed -- "handles empty input" is not 80% true.
    """
    partly_passed = FakeResult(5, False)
    partly_passed.cases_total = 10
    partly_passed.cases_passed = 9

    breakdown = compute_score([partly_passed, FakeResult(5, True)])

    assert breakdown.final == Decimal("50.00")


def test_editorial_multiplier_applied_when_viewed():
    results = [FakeResult(1, True)]
    breakdown = compute_score(results, editorial_viewed=True)

    assert breakdown.final == Decimal("50.00")  # default multiplier 0.5
    assert breakdown.editorial_multiplier == Decimal("0.5")


def test_hint_and_editorial_multipliers_compound():
    results = [FakeResult(1, True)]
    breakdown = compute_score(results, editorial_viewed=True, hint_used=True)

    # 100 * 0.5 * 0.8
    assert breakdown.final == Decimal("40.00")


def test_rubric_overrides_platform_default():
    """A pinned rubric must win over the current settings value.

    This is what makes principle 5 meaningful: rescoring an old submission has
    to reproduce the old number, not today's number.
    """
    results = [FakeResult(1, True)]
    breakdown = compute_score(
        results, rubric={"editorial_multiplier": 0.25}, editorial_viewed=True
    )

    assert breakdown.final == Decimal("25.00")


def test_zero_total_weight_does_not_divide_by_zero():
    breakdown = compute_score([])

    assert breakdown.final == Decimal("0.00")
    assert breakdown.total_weight == 0


def test_raw_score_ignores_multipliers():
    """raw is the unpenalised score, so a rubric change can be reasoned about."""
    results = [FakeResult(1, True), FakeResult(1, False)]
    breakdown = compute_score(results, editorial_viewed=True)

    assert breakdown.raw == Decimal("50.00")
    assert breakdown.final == Decimal("25.00")


# ---------------------------------------------------------------------------
# Verdict derivation
# ---------------------------------------------------------------------------


def test_all_passed_yields_accepted():
    results = [FakeResult(1, True), FakeResult(1, True)]
    assert overall_verdict(results, expected_group_count=2) == "accepted"


def test_reports_first_failure_in_order_not_worst():
    """The first failure is the actionable one for someone fixing their code."""
    results = [
        FakeResult(1, True),
        FakeResult(1, False, verdict="wrong_answer"),
        FakeResult(1, False, verdict="time_limit_exceeded"),
    ]
    assert overall_verdict(results, expected_group_count=3) == "wrong_answer"


def test_missing_results_is_internal_error_not_accepted():
    """Incomplete judging must never read as a pass.

    Reporting "accepted" for a submission that only half-ran would be a
    fairness incident, which §4 of the design doc treats as categorically worse
    than a practice-mode annoyance.
    """
    results = [FakeResult(1, True)]
    assert overall_verdict(results, expected_group_count=3) == "internal_error"


@pytest.mark.parametrize(
    ("verdict", "expected"),
    [
        ("accepted", True),
        ("wrong_answer", True),
        ("time_limit_exceeded", True),
        ("runtime_error", True),
        # §3.6: these did not compile and run, so they are not evidence of
        # engagement and must not unlock an editorial.
        ("compile_error", False),
        ("internal_error", False),
        ("cancelled", False),
        ("sandbox_violation", False),
    ],
)
def test_genuine_attempt_classification(verdict, expected):
    from apps.submissions.models import Verdict

    assert Verdict.counts_as_genuine_attempt(verdict) is expected
