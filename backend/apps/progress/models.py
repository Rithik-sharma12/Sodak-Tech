"""Per-user, per-problem progress.

SODAK-TECH-DESIGN.md §3.3 is unusually specific about this table, and about
what it must not be:

    Progress must be a normalized table with a unique constraint on
    (user, problem) -- not a serialized blob on the user record. Blob storage
    cannot be indexed, cannot be aggregated by tag without loading every user,
    and loses concurrent updates silently.

The unique constraint below is that requirement. The `record_submission`
classmethod is written to be concurrency-safe for the same reason -- two
submissions finishing at once must not lose one another's attempt count.
"""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models, transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimestampedModel, UUIDPrimaryKeyModel


class ProgressState(models.TextChoices):
    NOT_ATTEMPTED = "not_attempted", _("Not attempted")
    ATTEMPTED = "attempted", _("Attempted")
    PARTIAL = "partial", _("Partially solved")
    SOLVED = "solved", _("Solved")


class UserProblemProgress(UUIDPrimaryKeyModel, TimestampedModel):
    """One row per (user, problem). Never a blob."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="progress"
    )
    problem = models.ForeignKey(
        "problems.Problem", on_delete=models.CASCADE, related_name="progress"
    )

    state = models.CharField(
        max_length=16,
        choices=ProgressState.choices,
        default=ProgressState.NOT_ATTEMPTED,
        db_index=True,
    )

    best_score = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    attempt_count = models.PositiveIntegerField(default=0)
    # §3.6 counts only attempts that compiled and ran toward editorial unlock,
    # so it is tracked separately from raw attempts.
    genuine_attempt_count = models.PositiveIntegerField(default=0)

    first_attempt_at = models.DateTimeField(null=True, blank=True)
    first_solved_at = models.DateTimeField(null=True, blank=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)

    # §3.5: "Mastery is tracked separately from score. A problem solved after
    # viewing the editorial produces a score but not mastery. Mastery requires
    # an unaided solve."
    editorial_viewed_at = models.DateTimeField(null=True, blank=True)
    hint_used = models.BooleanField(default=False)
    has_mastery = models.BooleanField(default=False, db_index=True)

    best_submission = models.ForeignKey(
        "submissions.Submission",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    class Meta:
        db_table = "user_problem_progress"
        constraints = [
            # The constraint §3.3 asks for by name.
            models.UniqueConstraint(fields=["user", "problem"], name="uniq_user_problem_progress")
        ]
        indexes = [
            # Solved counts per user.
            models.Index(fields=["user", "state"], name="idx_progress_user_state"),
            # Mastery breakdown, and the per-tag aggregation joins through
            # problem from here.
            models.Index(fields=["user", "has_mastery"], name="idx_progress_user_mastery"),
            models.Index(fields=["problem", "state"], name="idx_progress_problem_state"),
        ]

    def __str__(self) -> str:
        return f"{self.user} / {self.problem.slug}: {self.state}"

    @classmethod
    @transaction.atomic
    def record_submission(cls, submission) -> UserProblemProgress:  # noqa: ANN001
        """Fold a judged submission into progress.

        Takes a row lock rather than read-modify-writing in Python. Two
        submissions for the same problem finishing simultaneously is ordinary
        (principle 7), and without the lock one of the two attempt increments
        is lost -- exactly the silent-loss failure §3.3 warns about.
        """
        from apps.submissions.models import Verdict

        progress, _created = cls.objects.get_or_create(
            user=submission.user, problem=submission.problem
        )
        progress = cls.objects.select_for_update().get(pk=progress.pk)

        now = timezone.now()
        progress.attempt_count += 1
        progress.last_attempt_at = now
        if progress.first_attempt_at is None:
            progress.first_attempt_at = now

        if Verdict.counts_as_genuine_attempt(submission.verdict):
            progress.genuine_attempt_count += 1

        score = Decimal(submission.score)
        if score > progress.best_score:
            progress.best_score = score
            progress.best_submission = submission

        if submission.is_accepted:
            if progress.first_solved_at is None:
                progress.first_solved_at = now
            progress.state = ProgressState.SOLVED
            # Mastery requires an unaided solve (§3.5). Once forfeited by
            # viewing the editorial, solving does not restore it.
            if progress.editorial_viewed_at is None and not progress.hint_used:
                progress.has_mastery = True
        elif score > 0:
            if progress.state != ProgressState.SOLVED:
                progress.state = ProgressState.PARTIAL
        elif progress.state == ProgressState.NOT_ATTEMPTED:
            progress.state = ProgressState.ATTEMPTED

        progress.save()
        return progress

    def mark_editorial_viewed(self) -> None:
        """Record the unlock before the content is returned (§3.6).

        Ordering matters: if the write fails, the user must not have seen the
        editorial. Recording after serving would let a failed write hand out
        the content for free.
        """
        if self.editorial_viewed_at is None:
            self.editorial_viewed_at = timezone.now()
            # Viewing forfeits mastery from this point on, but does not revoke
            # mastery already earned by an earlier unaided solve.
            self.save(update_fields=["editorial_viewed_at", "updated_at"])
