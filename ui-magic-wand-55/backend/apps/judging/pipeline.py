"""Turns sandbox output into a verdict, a score, and progress.

This is the half of judging that must not live in the sandbox. Expected outputs
are read here and compared here (§8.1: "expected output never leaves the
application core"), so nothing a submission does can reach them.

Principle 4 governs the ordering: per-group results are written first as raw
facts, then the verdict and score are derived from those rows. A rejudge
recomputes from stored results without re-running anything.
"""

from __future__ import annotations

import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.judging.sandbox import SandboxUnavailable, run_submission
from apps.problems.models import TestGroup
from apps.submissions.models import Submission, SubmissionKind, SubmissionResult, Verdict
from apps.submissions.scoring import compute_score, overall_verdict

logger = logging.getLogger("sodak.judge")

# Maps the sandbox's vocabulary onto platform verdicts. §7.1 requires
# resource-exhaustion kills to map to explicit verdicts rather than to a
# generic internal error -- a user who sees INTERNAL_ERROR for their own fork
# bomb learns nothing about what went wrong.
STATUS_TO_VERDICT = {
    "time_limit_exceeded": Verdict.TIME_LIMIT_EXCEEDED,
    "memory_limit_exceeded": Verdict.MEMORY_LIMIT_EXCEEDED,
    "output_limit_exceeded": Verdict.OUTPUT_LIMIT_EXCEEDED,
    "runtime_error": Verdict.RUNTIME_ERROR,
    "internal_error": Verdict.INTERNAL_ERROR,
}


def normalise(text: str) -> str:
    """§7.1: a trailing newline is not a wrong answer.

    Line endings are unified and trailing whitespace is dropped per line, so
    the same program judged from Windows and Linux gets the same verdict.
    """
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    return "\n".join(line.rstrip() for line in lines).strip()


def outputs_match(actual: str, expected: str, *, mode: str, tolerance: float | None) -> bool:
    if mode == "float":
        actual_tokens = normalise(actual).split()
        expected_tokens = normalise(expected).split()
        if len(actual_tokens) != len(expected_tokens):
            return False
        eps = tolerance if tolerance is not None else 1e-6
        for got, want in zip(actual_tokens, expected_tokens, strict=True):
            try:
                if abs(float(got) - float(want)) > eps:
                    return False
            except ValueError:
                # Not a number on either side: fall back to exact comparison so
                # a mixed text/number format still judges correctly.
                if got != want:
                    return False
        return True

    return normalise(actual) == normalise(expected)


@transaction.atomic
def judge(submission: Submission) -> Submission:
    """Judge one submission end to end and persist the outcome."""
    version = submission.problem_version

    groups = list(
        TestGroup.objects.filter(problem_version=version)
        .prefetch_related("test_cases")
        .order_by("order")
    )
    # "Run" executes sample groups only; "Submit" executes everything (§3.2).
    if submission.kind == SubmissionKind.RUN:
        groups = [g for g in groups if g.is_sample]

    if not groups:
        submission.verdict = Verdict.INTERNAL_ERROR
        submission.compile_output = "This problem version has no test groups."
        submission.judged_at = timezone.now()
        submission.save()
        return submission

    Submission.objects.filter(pk=submission.pk).update(verdict=Verdict.RUNNING)

    # Flatten to one ordered list so the whole submission runs in a single
    # container. A container per case would be cleaner to reason about and far
    # too slow -- §3.5 puts cold start at seconds per submission.
    ordered_cases: list[tuple[str, str]] = []
    case_index: dict[str, tuple[TestGroup, int, str]] = {}
    for group in groups:
        for position, case in enumerate(group.test_cases.all().order_by("order")):
            key = str(case.id)
            ordered_cases.append((key, case.input_data))
            case_index[key] = (group, position, case.expected_output)

    try:
        outcome = run_submission(
            source=submission.source_code,
            language_id=submission.language,
            inputs=ordered_cases,
            time_limit_ms=version.time_limit_ms,
            memory_limit_mb=version.memory_limit_mb,
        )
    except SandboxUnavailable as exc:
        # §4.8: an infrastructure failure is reported as one. Recording this as
        # a wrong answer would tell a learner their correct program was wrong.
        logger.error("Sandbox unavailable judging %s: %s", submission.id, exc)
        submission.verdict = Verdict.INTERNAL_ERROR
        submission.compile_output = (
            "The judge was unavailable and this submission was not run. "
            "It will be rejudged; your score is unaffected."
        )
        submission.judged_at = timezone.now()
        submission.save()
        return submission

    submission.results.all().delete()

    if not outcome.compiled:
        return _record_compile_error(submission, groups, outcome.compile_output)

    by_case = {case.id: case for case in outcome.cases}

    results: list[SubmissionResult] = []
    max_runtime = 0
    max_memory = 0

    for group in groups:
        cases = list(group.test_cases.all().order_by("order"))
        passed_count = 0
        group_verdict = Verdict.ACCEPTED
        first_failing: int | None = None
        case_details: list[dict] = []

        for position, case in enumerate(cases):
            reported = by_case.get(str(case.id))

            if reported is None:
                # The runner stopped early. Anything it did not reach is
                # unjudged, not passed -- scoring treats a short result set as
                # incomplete rather than accepted.
                case_verdict = Verdict.INTERNAL_ERROR
                actual = ""
                runtime = 0
                memory = 0
            else:
                actual = reported.stdout
                runtime = reported.runtime_ms
                memory = reported.memory_kb
                max_runtime = max(max_runtime, runtime)
                max_memory = max(max_memory, memory)

                if reported.status == "ok":
                    _, _, expected = case_index[str(case.id)]
                    if outputs_match(
                        actual,
                        expected,
                        mode=version.comparison_mode,
                        tolerance=version.float_tolerance,
                    ):
                        case_verdict = Verdict.ACCEPTED
                        passed_count += 1
                    else:
                        case_verdict = Verdict.WRONG_ANSWER
                else:
                    case_verdict = STATUS_TO_VERDICT.get(
                        reported.status, Verdict.RUNTIME_ERROR
                    )

            if case_verdict != Verdict.ACCEPTED and first_failing is None:
                first_failing = position
                group_verdict = case_verdict

            # §8.1: hidden-group inputs and expected outputs never reach the
            # client, so detail is kept for sample groups only.
            if group.is_sample:
                case_details.append(
                    {
                        "case_number": position + 1,
                        "input": case.input_data,
                        "expected": case.expected_output,
                        "actual": actual[:2000],
                        "stderr": (reported.stderr[:1000] if reported else ""),
                        "status": case_verdict,
                        "runtime": runtime,
                        "memory": memory,
                    }
                )

        results.append(
            SubmissionResult(
                submission=submission,
                test_group=group,
                verdict=group_verdict,
                passed=passed_count == len(cases) and len(cases) > 0,
                cases_total=len(cases),
                cases_passed=passed_count,
                weight=group.weight,
                max_runtime_ms=max_runtime,
                max_memory_kb=max_memory or None,
                first_failing_case_index=first_failing,
                case_results=case_details,
            )
        )

    SubmissionResult.objects.bulk_create(results)

    breakdown = compute_score(results, rubric=version.rubric)
    submission.verdict = overall_verdict(results, expected_group_count=len(results))
    submission.raw_score = breakdown.raw
    submission.score = breakdown.final
    submission.max_runtime_ms = max_runtime
    submission.max_memory_kb = max_memory or None
    submission.compile_output = outcome.compile_output[:4000]
    submission.judged_at = timezone.now()
    submission.save()

    _record_progress(submission)
    return submission


def _record_compile_error(
    submission: Submission, groups: list[TestGroup], output: str
) -> Submission:
    """A compile error fails every group at zero, so the score is honest.

    Writing no rows at all would leave scoring to infer the outcome from an
    empty set, and an empty set is indistinguishable from "not judged yet".
    """
    SubmissionResult.objects.bulk_create(
        [
            SubmissionResult(
                submission=submission,
                test_group=group,
                verdict=Verdict.COMPILE_ERROR,
                passed=False,
                cases_total=group.test_cases.count(),
                cases_passed=0,
                weight=group.weight,
                max_runtime_ms=0,
                first_failing_case_index=0,
                case_results=[],
            )
            for group in groups
        ]
    )

    submission.verdict = Verdict.COMPILE_ERROR
    submission.raw_score = Decimal("0")
    submission.score = Decimal("0")
    submission.compile_output = (output or "Compilation failed.")[:4000]
    submission.judged_at = timezone.now()
    submission.save()

    _record_progress(submission)
    return submission


def _record_progress(submission: Submission) -> None:
    """A Run is a trial against samples and must never count as an attempt.

    Otherwise experimenting would drain the editorial-unlock budget in §3.6,
    which would teach users not to experiment.
    """
    if submission.kind != SubmissionKind.SUBMIT:
        return

    from apps.progress.models import UserProblemProgress

    UserProblemProgress.record_submission(submission)

    problem = submission.problem
    problem.attempt_count = Decimal(problem.attempt_count) + 1
    if submission.is_accepted:
        problem.solved_count += 1
    problem.save(update_fields=["attempt_count", "solved_count", "updated_at"])


__all__ = ["judge", "normalise", "outputs_match"]
