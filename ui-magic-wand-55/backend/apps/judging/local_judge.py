"""Local demo judge. THIS IS NOT THE JUDGE.

    ┌────────────────────────────────────────────────────────────────────┐
    │  This module runs submitted code in a plain subprocess on the      │
    │  machine that hosts the database. That is precisely the topology   │
    │  SODAK-TECH-DESIGN.md §3.1 forbids:                                │
    │                                                                    │
    │      "Zone 3 never connects to the database. [...] A sandbox       │
    │       escape lands the attacker in an empty machine with no        │
    │       credentials and no network route."                           │
    │                                                                    │
    │  There is no seccomp filter, no process limit, no memory ceiling,  │
    │  no network namespace, no filesystem isolation. Design principle 2 │
    │  is "All learner code is hostile code" and this module assumes the │
    │  exact opposite.                                                   │
    │                                                                    │
    │  It exists so the frontend integration can be demonstrated end to  │
    │  end on one laptop with code you wrote yourself. It must never     │
    │  run anywhere a stranger can submit to it.                         │
    └────────────────────────────────────────────────────────────────────┘

The real implementation replaces this with: enqueue to a durable queue → an
isolated worker pool claims the job → the QingdaoU seccomp judger runs it
inside gVisor or Kata → the worker returns a verdict authenticated by a
short-lived token scoped to that one submission.

Guarded by DEBUG, so it fails closed if it ever reaches a deployed setting
(principle 10).
"""

from __future__ import annotations

import logging
import subprocess  # noqa: S404 -- see the module docstring
import sys
import tempfile
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.problems.models import TestGroup
from apps.submissions.models import Submission, SubmissionKind, SubmissionResult, Verdict
from apps.submissions.scoring import compute_score, overall_verdict

logger = logging.getLogger("sodak.judge")

# Wall-clock ceiling per test case, on top of the problem's own limit. Crude,
# but this runner has no CPU accounting -- §7.1 requires measuring CPU time
# rather than wall clock, which is one more thing only the real sandbox does.
HARD_TIMEOUT_SECONDS = 10


class LocalJudgeDisabled(RuntimeError):
    pass


def _normalise(text: str) -> str:
    """§7.1: normalise line endings and strip trailing whitespace before
    comparison, so a trailing newline is not a wrong answer."""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    return "\n".join(line.rstrip() for line in lines).strip()


def _run_once(source: str, language: str, stdin_data: str) -> tuple[str, str, int]:
    """Execute once. Returns (stdout, stderr, returncode)."""
    if language not in {"python", "python3"}:
        return "", f"The local demo judge only supports Python, not {language!r}.", -1

    with tempfile.TemporaryDirectory() as tmpdir:
        script = Path(tmpdir) / "solution.py"
        script.write_text(source, encoding="utf-8")

        try:
            proc = subprocess.run(  # noqa: S603 -- demo only, see module docstring
                [sys.executable, "-I", "-S", str(script)],
                input=stdin_data,
                capture_output=True,
                text=True,
                timeout=HARD_TIMEOUT_SECONDS,
                cwd=tmpdir,
            )
        except subprocess.TimeoutExpired:
            return "", "__TIMEOUT__", -1
        except Exception as exc:  # noqa: BLE001
            return "", f"runner error: {exc}", -1

        return proc.stdout, proc.stderr, proc.returncode


@transaction.atomic
def judge_submission(submission: Submission) -> Submission:
    """Judge a submission and persist per-group results.

    Writes SubmissionResult rows first, then derives the verdict and score from
    them -- principle 4, store raw facts and compute derived values. The score
    here goes through the same `compute_score` the real judge will use, so the
    scoring path is genuinely exercised by the demo.
    """
    if not settings.DEBUG:
        raise LocalJudgeDisabled(
            "The local demo judge is disabled outside DEBUG. Deploy real "
            "sandboxed workers -- see SODAK-TECH-DESIGN.md §3.1 and §8.1."
        )

    logger.warning(
        "Judging submission %s with the LOCAL DEMO JUDGE — no sandbox, no "
        "isolation. Never expose this to untrusted submissions.",
        submission.id,
    )

    submission.verdict = Verdict.RUNNING
    submission.save(update_fields=["verdict", "updated_at"])

    version = submission.problem_version
    groups = TestGroup.objects.filter(problem_version=version).prefetch_related("test_cases")

    # "Run" executes sample groups only; "Submit" executes everything (§3.2).
    if submission.kind == SubmissionKind.RUN:
        groups = groups.filter(is_sample=True)

    submission.results.all().delete()

    results: list[SubmissionResult] = []
    max_runtime = 0
    compile_output = ""

    for group in groups:
        cases = list(group.test_cases.all())
        passed_count = 0
        group_verdict = Verdict.ACCEPTED
        first_failing: int | None = None
        case_details: list[dict] = []

        for index, case in enumerate(cases):
            started = timezone.now()
            stdout, stderr, returncode = _run_once(
                submission.source_code, submission.language, case.input_data
            )
            elapsed_ms = int((timezone.now() - started).total_seconds() * 1000)
            max_runtime = max(max_runtime, elapsed_ms)

            if stderr == "__TIMEOUT__":
                case_verdict = Verdict.TIME_LIMIT_EXCEEDED
            elif returncode != 0:
                case_verdict = Verdict.RUNTIME_ERROR
                compile_output = compile_output or stderr[:4000]
            elif _normalise(stdout) == _normalise(case.expected_output):
                case_verdict = Verdict.ACCEPTED
                passed_count += 1
            else:
                case_verdict = Verdict.WRONG_ANSWER

            if case_verdict != Verdict.ACCEPTED and first_failing is None:
                first_failing = index
                group_verdict = case_verdict

            # Detail is kept only for sample groups. Hidden-group inputs and
            # expected outputs must never reach the client (§8.1).
            if group.is_sample:
                case_details.append(
                    {
                        "case_number": index + 1,
                        "input": case.input_data,
                        "expected": case.expected_output,
                        "actual": stdout[:2000],
                        "status": case_verdict,
                        "runtime": elapsed_ms,
                        "memory": 0,
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
    submission.compile_output = compile_output
    submission.judged_at = timezone.now()
    submission.save()

    # A "Run" is a trial against samples and must not count as an attempt --
    # otherwise experimenting would drain the editorial-unlock budget in §3.6.
    if submission.kind == SubmissionKind.SUBMIT:
        from apps.progress.models import UserProblemProgress

        UserProblemProgress.record_submission(submission)

        submission.problem.attempt_count = Decimal(submission.problem.attempt_count) + 1
        if submission.is_accepted:
            submission.problem.solved_count += 1
        submission.problem.save(update_fields=["attempt_count", "solved_count", "updated_at"])

    return submission
