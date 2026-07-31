"""Submissions and their per-group results.

Principle 4 governs the shape of this module: "Store raw facts, compute derived
values. Persist which tests passed. Compute score from a versioned rubric. A
stored final score that cannot be recomputed is unrecoverable when the rubric
is wrong."

So SubmissionResult holds what happened, and `score` on Submission is a cached
projection of it that can be rebuilt at any time by the scoring service.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimestampedModel, UUIDPrimaryKeyModel


class Verdict(models.TextChoices):
    """Judging outcomes.

    §7.1 requires that resource-exhaustion kills map to explicit verdicts:
    "Memory-limit kill misreported -- Map resource-exhaustion kills and signals
    to explicit verdicts, never a generic internal error." A user who sees
    INTERNAL_ERROR for their own fork bomb learns nothing.
    """

    PENDING = "pending", _("Pending")
    QUEUED = "queued", _("Queued")
    COMPILING = "compiling", _("Compiling")
    RUNNING = "running", _("Running")

    ACCEPTED = "accepted", _("Accepted")
    WRONG_ANSWER = "wrong_answer", _("Wrong Answer")
    TIME_LIMIT_EXCEEDED = "time_limit_exceeded", _("Time Limit Exceeded")
    MEMORY_LIMIT_EXCEEDED = "memory_limit_exceeded", _("Memory Limit Exceeded")
    OUTPUT_LIMIT_EXCEEDED = "output_limit_exceeded", _("Output Limit Exceeded")
    RUNTIME_ERROR = "runtime_error", _("Runtime Error")
    COMPILE_ERROR = "compile_error", _("Compile Error")
    PRESENTATION_ERROR = "presentation_error", _("Presentation Error")

    # Distinct from RUNTIME_ERROR: the sandbox stopped it, the program did not
    # fail on its own. Keeping them apart is what makes the adversarial suite
    # in §8.6 assertable.
    SANDBOX_VIOLATION = "sandbox_violation", _("Sandbox Violation")

    INTERNAL_ERROR = "internal_error", _("Internal Error")
    CANCELLED = "cancelled", _("Cancelled")

    @classmethod
    def terminal(cls) -> set[str]:
        return {
            cls.ACCEPTED, cls.WRONG_ANSWER, cls.TIME_LIMIT_EXCEEDED,
            cls.MEMORY_LIMIT_EXCEEDED, cls.OUTPUT_LIMIT_EXCEEDED, cls.RUNTIME_ERROR,
            cls.COMPILE_ERROR, cls.PRESENTATION_ERROR, cls.SANDBOX_VIOLATION,
            cls.INTERNAL_ERROR, cls.CANCELLED,
        }

    @classmethod
    def counts_as_genuine_attempt(cls, verdict: str) -> bool:
        """§3.6: editorial unlock counts attempts that "compiled and ran".

        An empty submission or one that failed to compile is not evidence of
        engagement, and counting it would let a user unlock an editorial by
        submitting whitespace N times.
        """
        return verdict in {
            cls.ACCEPTED, cls.WRONG_ANSWER, cls.TIME_LIMIT_EXCEEDED,
            cls.MEMORY_LIMIT_EXCEEDED, cls.OUTPUT_LIMIT_EXCEEDED, cls.RUNTIME_ERROR,
            cls.PRESENTATION_ERROR,
        }


class SubmissionKind(models.TextChoices):
    RUN = "run", _("Run (sample tests only)")
    SUBMIT = "submit", _("Submit (all test groups)")


class Submission(UUIDPrimaryKeyModel, TimestampedModel):
    """One judging request.

    Note there is no soft-delete mixin. §7.3 requires that deleting a problem
    with submissions is a soft delete precisely so that submissions survive;
    submissions themselves are never deleted at all.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="submissions"
    )
    problem = models.ForeignKey(
        "problems.Problem", on_delete=models.PROTECT, related_name="submissions"
    )

    # Principle 5: every submission pins the version it was judged against.
    # PROTECT, because losing this reference makes the verdict unexplainable.
    problem_version = models.ForeignKey(
        "problems.ProblemVersion", on_delete=models.PROTECT, related_name="submissions"
    )

    contest = models.ForeignKey(
        "contests.Contest",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="submissions",
    )

    # Seam for the deferred LMS layer: an assignment reference can be added
    # here without touching the judging path. Deliberately absent for now --
    # see the scope decision recorded in backend/README.md.

    kind = models.CharField(
        max_length=16, choices=SubmissionKind.choices, default=SubmissionKind.SUBMIT
    )

    language = models.CharField(max_length=32, db_index=True)
    # The exact runtime image digest this ran against, copied from the version
    # at dispatch. §7.1: "Pin versions per problem version; display to users."
    language_image = models.CharField(max_length=255, blank=True)

    source_code = models.TextField()
    source_bytes = models.PositiveIntegerField(default=0)

    verdict = models.CharField(
        max_length=32, choices=Verdict.choices, default=Verdict.PENDING, db_index=True
    )

    # Cached projection of SubmissionResult rows, recomputable at any time.
    score = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    raw_score = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    max_runtime_ms = models.PositiveIntegerField(null=True, blank=True)
    max_memory_kb = models.PositiveIntegerField(null=True, blank=True)

    compile_output = models.TextField(blank=True)

    # §7.1: "Duplicate submission from a double click -- client-supplied
    # idempotency key; repeat returns the existing submission." Principle 7
    # makes this the normal case, not an edge case.
    idempotency_key = models.CharField(max_length=64, db_index=True)

    # §7.2: "Cutoff on server receive time" -- never a client timestamp.
    received_at = models.DateTimeField(auto_now_add=True, db_index=True)
    judged_at = models.DateTimeField(null=True, blank=True)

    # Rejudge bookkeeping (principle 6).
    rejudge_count = models.PositiveIntegerField(default=0)
    is_rejudging = models.BooleanField(default=False)

    class Meta:
        db_table = "submissions"
        ordering = ["-received_at"]
        constraints = [
            # Idempotency is scoped per user, so two users cannot collide on a
            # guessable key.
            models.UniqueConstraint(
                fields=["user", "idempotency_key"], name="uniq_submission_idempotency"
            ),
        ]
        indexes = [
            # §3.3 of the stack doc names the indexes the real access patterns
            # need. These are those.
            models.Index(fields=["user", "-received_at"], name="idx_sub_user_recent"),
            models.Index(fields=["user", "problem", "-received_at"], name="idx_sub_user_problem"),
            models.Index(fields=["problem", "verdict"], name="idx_sub_problem_verdict"),
            models.Index(fields=["contest", "-received_at"], name="idx_sub_contest"),
            # Partial index on the pending queue -- it is small and hot, and a
            # full index on verdict would be neither.
            models.Index(
                fields=["received_at"],
                name="idx_sub_pending",
                condition=models.Q(verdict__in=["pending", "queued", "compiling", "running"]),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user} → {self.problem.slug} [{self.verdict}]"

    @property
    def is_terminal(self) -> bool:
        return self.verdict in Verdict.terminal()

    @property
    def is_accepted(self) -> bool:
        return self.verdict == Verdict.ACCEPTED


class SubmissionResult(UUIDPrimaryKeyModel, TimestampedModel):
    """Per-test-group outcome. The raw fact the score is derived from.

    One row per test group, not per test case. §3.5 awards partial credit per
    group, so the group is the unit whose pass/fail is worth persisting.
    Per-case detail lives in `case_results` for practice-mode feedback and is
    withheld during contests (§8.5).
    """

    submission = models.ForeignKey(
        Submission, on_delete=models.CASCADE, related_name="results"
    )
    test_group = models.ForeignKey(
        "problems.TestGroup", on_delete=models.PROTECT, related_name="results"
    )

    verdict = models.CharField(max_length=32, choices=Verdict.choices, db_index=True)

    # A group scores only if every case in it passed.
    passed = models.BooleanField(default=False)
    cases_total = models.PositiveIntegerField(default=0)
    cases_passed = models.PositiveIntegerField(default=0)

    # Weight copied from the group at judging time. Copied rather than joined
    # so that a later weight change does not silently rewrite history --
    # recomputing an old score must reproduce the old number.
    weight = models.PositiveIntegerField(default=1)

    max_runtime_ms = models.PositiveIntegerField(null=True, blank=True)
    max_memory_kb = models.PositiveIntegerField(null=True, blank=True)

    # §8.5: "Feedback during contests is limited to the verdict and at most a
    # failing test index -- never input, never a diff."
    first_failing_case_index = models.IntegerField(null=True, blank=True)

    # Detailed per-case results, practice mode only. Never serialised into a
    # contest response.
    case_results = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "submission_results"
        ordering = ["test_group__order"]
        constraints = [
            models.UniqueConstraint(
                fields=["submission", "test_group"], name="uniq_result_per_group"
            )
        ]
        indexes = [models.Index(fields=["submission", "verdict"])]

    def __str__(self) -> str:
        return f"{self.submission_id} / {self.test_group.name}: {self.verdict}"
