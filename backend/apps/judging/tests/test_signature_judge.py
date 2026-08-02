"""End-to-end tests for signature-mode judging.

These exercise the full local-judge path: the learner's function is merged into
the version's driver, the harness parses each test case, calls the function,
and the exact-output comparison runs exactly as in io mode. A regression here
means the "write just the function" contract is broken, which is the entire
point of signature mode.
"""

from __future__ import annotations

import pytest
from django.utils import timezone

from apps.judging.local_judge import judge_submission
from apps.problems.models import (
    Difficulty,
    JudgingMode,
    Problem,
    ProblemVersion,
    TestCase,
    TestGroup,
)
from apps.submissions.models import Submission, SubmissionKind, Verdict

USER_CODE_MARKER = "%%USER_CODE%%"


@pytest.fixture(autouse=True)
def _enable_debug(settings):
    # pytest-django 4.x forces DEBUG off unless django_debug_mode=keep, but the
    # local demo judge deliberately refuses to run outside DEBUG (it is guarded
    # so it can never reach a deployed setting). These tests exercise that
    # judge, so they opt back in.
    settings.DEBUG = True

# Learner code and driver that call the same function, per language. The
# driver is deliberately small and language-specific rather than generated:
# argument parsing and output formatting are problem semantics, not something a
# generic harness can infer.
DRIVERS = {
    "python": (
        "def twoSum(nums, target):\n"
        "    seen = {}\n"
        "    for i, x in enumerate(nums):\n"
        "        need = target - x\n"
        "        if need in seen:\n"
        "            return [seen[need], i]\n"
        "        seen[x] = i\n"
        "    return []\n",
        "import sys\n"
        f"{USER_CODE_MARKER}\n"
        "def main():\n"
        "    data = sys.stdin.read().split()\n"
        "    n = int(data[0])\n"
        "    nums = [int(x) for x in data[1:1 + n]]\n"
        "    target = int(data[1 + n])\n"
        "    r = twoSum(nums, target)\n"
        "    if not r: r = [-1, -1]\n"
        "    print(' '.join(map(str, r)))\n"
        "main()\n",
    ),
    "cpp": (
        "#include <vector>\n"
        "using namespace std;\n"
        "vector<int> twoSum(vector<int>& nums, int target) {\n"
        "    for (int i = 0; i < (int)nums.size(); ++i)\n"
        "        for (int j = i + 1; j < (int)nums.size(); ++j)\n"
        "            if (nums[i] + nums[j] == target) return {i, j};\n"
        "    return {};\n"
        "}\n",
        "#include <bits/stdc++.h>\n"
        "using namespace std;\n"
        f"{USER_CODE_MARKER}\n"
        "int main() {\n"
        "    int n; cin >> n;\n"
        "    vector<int> nums(n);\n"
        "    for (int i = 0; i < n; ++i) cin >> nums[i];\n"
        "    int target; cin >> target;\n"
        "    auto r = twoSum(nums, target);\n"
        "    if (r.empty()) cout << \"-1 -1\\n\";\n"
        "    else cout << r[0] << ' ' << r[1] << '\\n';\n"
        "    return 0;\n"
        "}\n",
    ),
}


@pytest.fixture
def signature_problem(db, django_user_model) -> tuple[Problem, ProblemVersion]:  # noqa: ANN001
    author = django_user_model.objects.create_user(
        email="author@example.com", password="password", username="author"
    )
    problem = Problem.objects.create(
        slug="signature-demo",
        title="Signature Demo",
        statement="Return indices summing to target.",
        difficulty=Difficulty.EASY,
        author=author,
        is_public=True,
    )
    version = ProblemVersion.objects.create(
        problem=problem,
        version_number=1,
        judge_mode=JudgingMode.SIGNATURE,
        signature_templates={
            lang: {"starter": "stub", "driver": driver} for lang, (_, driver) in DRIVERS.items()
        },
        created_by=author,
        published_at=timezone.now(),
    )
    sample = TestGroup.objects.create(
        problem_version=version, name="Sample", weight=20, is_sample=True, order=0
    )
    TestCase.objects.create(
        test_group=sample, order=0, input_data="4\n2 7 11 15\n9\n", expected_output="0 1\n"
    )
    hidden = TestGroup.objects.create(
        problem_version=version, name="Hidden", weight=80, is_sample=False, order=1
    )
    TestCase.objects.create(
        test_group=hidden, order=0, input_data="2\n5 5\n10\n", expected_output="0 1\n"
    )
    TestCase.objects.create(
        test_group=hidden, order=1, input_data="3\n1 2 3\n100\n", expected_output="-1 -1\n"
    )
    problem.current_version = version
    problem.save(update_fields=["current_version"])
    return problem, version


def _submit(django_user_model, problem, language, source) -> Submission:  # noqa: ANN001
    user = django_user_model.objects.create_user(
        email=f"{language}@example.com", password="password", username=f"u-{language}"
    )
    return judge_submission(
        Submission.objects.create(
            user=user,
            problem=problem,
            problem_version=problem.current_version,
            kind=SubmissionKind.SUBMIT,
            language=language,
            source_code=source,
            source_bytes=len(source.encode("utf-8")),
            idempotency_key=f"key-{language}-{len(source)}",
            verdict=Verdict.QUEUED,
        )
    )


@pytest.mark.parametrize("language", ["python", "cpp"])
def test_correct_function_passes_all_groups(signature_problem, django_user_model, language):
    problem, _ = signature_problem
    source, _ = DRIVERS[language]

    submission = _submit(django_user_model, problem, language, source)

    assert submission.verdict == Verdict.ACCEPTED
    assert str(submission.score) == "100.00"
    assert submission.results.count() == 2
    assert all(r.passed for r in submission.results.all())


@pytest.mark.parametrize("language", ["python", "cpp"])
def test_io_submission_against_signature_problem_fails_cleanly(
    signature_problem, django_user_model, language
):
    """A stdin-reading program has no twoSum function: the driver fails at
    runtime (NameError/link), and the verdict must be honest, not a crash."""
    problem, _ = signature_problem
    io_program = (
        "import sys\nprint(sys.stdin.read())\n" if language == "python"
        else "int main() { return 0; }\n"
    )

    submission = _submit(django_user_model, problem, language, io_program)

    accepted = {Verdict.RUNTIME_ERROR, Verdict.COMPILE_ERROR, Verdict.WRONG_ANSWER}
    assert submission.verdict in accepted
    assert submission.results.first().passed is False


@pytest.mark.parametrize("language", ["python", "cpp"])
def test_python_syntax_error_is_compile_error(signature_problem, django_user_model, language):
    problem, _ = signature_problem
    broken = (
        "def twoSum(nums, target):\n    return [1, 2\n"  # unclosed bracket
        if language == "python"
        else "vector<int> twoSum(vector<int>& nums, int target) {\n    return {1, 2;\n"
    )

    submission = _submit(django_user_model, problem, language, broken)

    assert submission.verdict == Verdict.COMPILE_ERROR


def test_sample_only_run_kind_does_not_touch_hidden(signature_problem, django_user_model):
    problem, _ = signature_problem
    source, _ = DRIVERS["python"]
    user = django_user_model.objects.create_user(
        email="runner@example.com", password="password", username="runner"
    )
    submission = judge_submission(
        Submission.objects.create(
            user=user,
            problem=problem,
            problem_version=problem.current_version,
            kind=SubmissionKind.RUN,
            language="python",
            source_code=source,
            source_bytes=len(source.encode("utf-8")),
            idempotency_key="key-run",
            verdict=Verdict.QUEUED,
        )
    )

    assert submission.results.count() == 1
    assert submission.results.first().test_group.is_sample


def test_missing_driver_for_language_is_internal_error(signature_problem, django_user_model):
    """A version that offers a language without a driver is misconfigured and
    must fail as internal_error, never as the learner's fault."""
    problem, _ = signature_problem
    no_driver = "int twoSum(int* n, int a, int t, int* r) { return 0; }\n"
    submission = _submit(django_user_model, problem, "c", no_driver)

    assert submission.verdict == Verdict.INTERNAL_ERROR
    assert submission.results.first().passed is False
