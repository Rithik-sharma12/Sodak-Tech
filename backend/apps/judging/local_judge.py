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

from apps.problems.models import JudgingMode, TestGroup
from apps.submissions.models import Submission, SubmissionKind, SubmissionResult, Verdict
from apps.submissions.scoring import compute_score, overall_verdict

logger = logging.getLogger("sodak.judge")

# Wall-clock ceiling per test case, on top of the problem's own limit. Crude,
# but this runner has no CPU accounting -- §7.1 requires measuring CPU time
# rather than wall clock, which is one more thing only the real sandbox does.
HARD_TIMEOUT_SECONDS = 10


class LocalJudgeDisabled(RuntimeError):
    pass


LANGUAGE_ALIASES = {
    "python": "python",
    "python3": "python",
    "py": "python",
    "java": "java",
    "cpp": "cpp",
    "c++": "cpp",
    "cc": "cpp",
    "c": "c",
}


def _canonical_language(language: str) -> str:
    return LANGUAGE_ALIASES.get(language.strip().lower(), language.strip().lower())


def _normalise(text: str) -> str:
    """§7.1: normalise line endings and strip trailing whitespace before
    comparison, so a trailing newline is not a wrong answer."""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    return "\n".join(line.rstrip() for line in lines).strip()


# Marker where the submitted source is injected into a signature-mode driver.
USER_CODE_MARKER = "%%USER_CODE%%"


class MisconfiguredProblem(RuntimeError):
    """The version advertises a judge mode its data cannot serve.

    Treated as an internal error on the submission: it is the platform's fault,
    never the learner's, and must not count as an attempt.
    """


def _effective_source(submission: Submission) -> str:
    """The exact program that runs on the judge host.

    `io` submissions are the learner's program, unchanged. `signature`
    submissions are the learner's function injected into the version's
    setter-authored driver, so the test-set I/O contract stays identical and
    only the author-facing contract changes.
    """
    version = submission.problem_version
    if version.judge_mode != JudgingMode.SIGNATURE:
        return submission.source_code

    templates = version.signature_templates.get(submission.language)
    if not templates or "driver" not in templates:
        raise MisconfiguredProblem(
            f"Problem {version.problem.slug} v{version.version_number} is signature-mode "
            f"but has no driver template for {submission.language!r}."
        )
    merged = templates["driver"].replace(USER_CODE_MARKER, submission.source_code)
    if USER_CODE_MARKER in merged:
        # Guarded so a driver that lost its marker fails loudly instead of
        # silently judging the harness alone.
        raise MisconfiguredProblem(
            f"Driver template for {version.problem.slug} {submission.language!r} "
            f"has no {USER_CODE_MARKER!r} marker."
        )
    return merged


def _prepare_runtime(source: str, language: str, workspace: Path) -> tuple[list[str] | None, str]:
    """Prepare executable runtime for a language.

    Returns (run_command, compile_error). If compile_error is non-empty,
    run_command will be None.
    """
    canonical = _canonical_language(language)

    if canonical == "python":
        script = workspace / "solution.py"
        script.write_text(source, encoding="utf-8")
        # A Python syntax error is a compile error, not a runtime error. A
        # missing closing paren surfacing as RUNTIME_ERROR teaches the wrong
        # thing. Compiled languages get this from the compiler; Python gets it
        # from a cheap in-process parse before the subprocess starts.
        try:
            compile(source, str(script), "exec")
        except SyntaxError as exc:
            line = exc.lineno or "?"
            detail = exc.text or ""
            return None, f'  File "solution.py", line {line}\n{detail}\nSyntaxError: {exc.msg}'
        return [sys.executable, "-I", "-S", str(script)], ""

    if canonical == "java":
        source_file = workspace / "Main.java"
        source_file.write_text(source, encoding="utf-8")
        try:
            compile_proc = subprocess.run(  # noqa: S603 -- demo only, see module docstring
                ["javac", str(source_file)],
                capture_output=True,
                text=True,
                cwd=workspace,
            )
        except FileNotFoundError:
            return None, "Java compiler not found (javac missing on host)."
        if compile_proc.returncode != 0:
            return None, (compile_proc.stderr or compile_proc.stdout or "Compile failed")[:4000]
        return ["java", "-cp", str(workspace), "Main"], ""

    if canonical == "cpp":
        source_file = workspace / "main.cpp"
        exe_file = workspace / "main.exe"
        source_file.write_text(source, encoding="utf-8")
        try:
            compile_proc = subprocess.run(  # noqa: S603 -- demo only, see module docstring
                ["g++", "-O2", "-std=c++17", str(source_file), "-o", str(exe_file)],
                capture_output=True,
                text=True,
                cwd=workspace,
            )
        except FileNotFoundError:
            return None, "C++ compiler not found (g++ missing on host)."
        if compile_proc.returncode != 0:
            return None, (compile_proc.stderr or compile_proc.stdout or "Compile failed")[:4000]
        return [str(exe_file)], ""

    if canonical == "c":
        source_file = workspace / "main.c"
        exe_file = workspace / "main.exe"
        source_file.write_text(source, encoding="utf-8")
        try:
            compile_proc = subprocess.run(  # noqa: S603 -- demo only, see module docstring
                ["gcc", "-O2", "-std=c17", str(source_file), "-o", str(exe_file)],
                capture_output=True,
                text=True,
                cwd=workspace,
            )
        except FileNotFoundError:
            return None, "C compiler not found (gcc missing on host)."
        if compile_proc.returncode != 0:
            return None, (compile_proc.stderr or compile_proc.stdout or "Compile failed")[:4000]
        return [str(exe_file)], ""

    return None, (
        f"Unsupported language {language!r}. Supported languages: "
        "python, java, cpp/c++, c."
    )


def _run_once(run_cmd: list[str], stdin_data: str, *, timeout_seconds: float, cwd: Path) -> tuple[str, str, int]:
    """Execute once. Returns (stdout, stderr, returncode)."""
    try:
        proc = subprocess.run(  # noqa: S603 -- demo only, see module docstring
            run_cmd,
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            cwd=cwd,
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

    total_cases = 0
    total_passed_cases = 0
    timeout_seen = False

    with tempfile.TemporaryDirectory() as tmpdir:
        workspace = Path(tmpdir)

        try:
            source = _effective_source(submission)
        except MisconfiguredProblem as exc:
            logger.error("Misconfigured problem: %s", exc)
            compile_output = str(exc)[:4000]
            run_cmd = None
            setup_verdict = Verdict.INTERNAL_ERROR
        else:
            run_cmd, compile_error = _prepare_runtime(source, submission.language, workspace)
            setup_verdict = Verdict.COMPILE_ERROR

        if run_cmd is None:
            if not compile_output:
                compile_output = compile_error[:4000]
            for group in groups:
                cases = list(group.test_cases.all())
                results.append(
                    SubmissionResult(
                        submission=submission,
                        test_group=group,
                        verdict=setup_verdict,
                        passed=False,
                        cases_total=len(cases),
                        cases_passed=0,
                        weight=group.weight,
                        max_runtime_ms=0,
                        first_failing_case_index=0 if cases else None,
                        case_results=[],
                    )
                )
                total_cases += len(cases)
        else:
            timeout_seconds = min(
                HARD_TIMEOUT_SECONDS,
                max(0.1, submission.problem_version.time_limit_ms / 1000),
            )

            for group in groups:
                cases = list(group.test_cases.all())
                passed_count = 0
                group_verdict = Verdict.ACCEPTED
                first_failing: int | None = None
                case_details: list[dict] = []
                group_max_runtime = 0

                for index, case in enumerate(cases):
                    started = timezone.now()
                    stdout, stderr, returncode = _run_once(
                        run_cmd,
                        case.input_data,
                        timeout_seconds=timeout_seconds,
                        cwd=workspace,
                    )
                    elapsed_ms = int((timezone.now() - started).total_seconds() * 1000)
                    max_runtime = max(max_runtime, elapsed_ms)
                    group_max_runtime = max(group_max_runtime, elapsed_ms)

                    if stderr == "__TIMEOUT__":
                        timeout_seen = True
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

                total_cases += len(cases)
                total_passed_cases += passed_count
                results.append(
                    SubmissionResult(
                        submission=submission,
                        test_group=group,
                        verdict=group_verdict,
                        passed=passed_count == len(cases) and len(cases) > 0,
                        cases_total=len(cases),
                        cases_passed=passed_count,
                        weight=group.weight,
                        max_runtime_ms=group_max_runtime,
                        first_failing_case_index=first_failing,
                        case_results=case_details,
                    )
                )

    SubmissionResult.objects.bulk_create(results)

    breakdown = compute_score(results, rubric=version.rubric)
    submission.verdict = overall_verdict(results, expected_group_count=len(results))
    submission.raw_score = breakdown.raw
    submission.score = breakdown.final

    # In timed-out runs, award partial marks by passed-case count. This keeps
    # progress measurable when a solution is close but does not finish all
    # cases within the time limit.
    if submission.verdict == Verdict.TIME_LIMIT_EXCEEDED and total_cases > 0:
        partial = (Decimal(total_passed_cases) / Decimal(total_cases)) * Decimal("100")
        submission.raw_score = partial.quantize(Decimal("0.01"))
        submission.score = submission.raw_score

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
