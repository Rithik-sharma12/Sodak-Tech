"""Editorials and their unlock policy.

SODAK-TECH-DESIGN.md §3.6 sets the rule that shapes this module:

    Editorial content must never appear in the response for a locked problem.
    It is served from a dedicated endpoint that performs its own authorization
    and returns a denial otherwise. Shipping the content and hiding it
    client-side is not gating.

So `content` is never included in a problem serializer. The only path to it is
the editorial detail endpoint, which calls `is_unlocked_for` first.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import SoftDeleteModel, TimestampedModel, UUIDPrimaryKeyModel


class Editorial(UUIDPrimaryKeyModel, TimestampedModel, SoftDeleteModel):
    problem = models.OneToOneField(
        "problems.Problem", on_delete=models.CASCADE, related_name="editorial"
    )

    # Never serialised except through the gated detail endpoint.
    content = models.TextField()

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="editorials"
    )

    # An admin may release editorials for a problem outright (§3.6).
    released_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "editorials"

    def __str__(self) -> str:
        return f"Editorial for {self.problem.slug}"

    def is_unlocked_for(self, user, progress=None) -> tuple[bool, str]:  # noqa: ANN001
        """Evaluate the unlock conditions server-side, on every fetch.

        §3.6 unlocks when *any* condition holds. Returns the reason alongside
        the decision so the caller can log why, and so a denial can tell the
        user what would unlock it without revealing the content.
        """
        from django.conf import settings as dj_settings

        if user.is_authenticated and user.has_role_at_least("admin"):
            return True, "admin"

        if self.released_at is not None and self.released_at <= timezone.now():
            return True, "released"

        if progress is None:
            return False, "no_progress"

        if progress.state == "solved":
            return True, "solved"

        if progress.genuine_attempt_count >= dj_settings.EDITORIAL_UNLOCK_ATTEMPTS:
            return True, "attempts"

        if progress.first_attempt_at is not None:
            elapsed = timezone.now() - progress.first_attempt_at
            if elapsed.total_seconds() >= dj_settings.EDITORIAL_UNLOCK_COOLDOWN_HOURS * 3600:
                return True, "cooldown"

        return False, "locked"

    @property
    def is_locked_by_active_contest(self) -> bool:
        """§8.5: editorials lock down while the problem is in a running contest.

        Checked independently of the per-user unlock conditions -- a user who
        has otherwise earned access still must not read it mid-contest.
        """
        from apps.contests.models import ContestState

        return self.problem.contest_appearances.filter(
            contest__state__in=[
                ContestState.RUNNING, ContestState.FROZEN, ContestState.PAUSED
            ]
        ).exists()
