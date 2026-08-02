"""Append-only audit trail.

SODAK-TECH-DESIGN.md §8.3 states the constraint plainly: "The audit log is not
deletable through the application by anyone, including Super Admin." And design
principle 9: "Admin capability without an audit trail is indistinguishable from
compromise."

Two mechanisms enforce this:

  * The model refuses update and delete at the Python level (below).
  * A database trigger refuses them at the SQL level (see the migration), so
    that raw ORM calls, `update()`, and a shell session cannot bypass it.

Application-level checks alone are not enough here -- `QuerySet.update()` never
calls `save()`, so a Python-only guard is trivially sidestepped by accident.
"""

from __future__ import annotations

from typing import Any, ClassVar

from django.conf import settings
from django.db import models

from apps.common.models import UUIDPrimaryKeyModel


class AuditAction(models.TextChoices):
    """Every privileged action that must leave a record.

    Additions are cheap; removals are not. A value that has been written to the
    log stays in this enum forever so old entries remain readable.
    """

    # Identity and access
    USER_ROLE_CHANGED = "user.role_changed", "User role changed"
    USER_DISABLED = "user.disabled", "User disabled"
    USER_ENABLED = "user.enabled", "User enabled"
    USER_PASSWORD_CHANGED = "user.password_changed", "User password changed"
    USER_MFA_RESET = "user.mfa_reset", "User MFA reset"
    IMPERSONATION_STARTED = "user.impersonation_started", "Impersonation started"

    # Problems and test data
    PROBLEM_CREATED = "problem.created", "Problem created"
    PROBLEM_UPDATED = "problem.updated", "Problem updated"
    PROBLEM_DELETED = "problem.deleted", "Problem soft-deleted"
    PROBLEM_VERSION_PUBLISHED = "problem.version_published", "Problem version published"
    # §8.3: "Every hidden test data read is itself an audited event."
    TEST_DATA_READ = "test_data.read", "Hidden test data read"
    TEST_DATA_UPLOADED = "test_data.uploaded", "Test data uploaded"
    CHECKER_CHANGED = "checker.changed", "Custom checker changed"

    # Judging
    REJUDGE_STARTED = "rejudge.started", "Rejudge started"
    REJUDGE_COMPLETED = "rejudge.completed", "Rejudge completed"

    # Contests
    CONTEST_CREATED = "contest.created", "Contest created"
    CONTEST_STATE_CHANGED = "contest.state_changed", "Contest state changed"
    CONTEST_FINALIZED = "contest.finalized", "Contest finalized"
    CONTEST_REJUDGE_AFTER_FINAL = "contest.rejudge_after_final", "Rejudge after finalization"
    STANDINGS_ADJUSTED = "contest.standings_adjusted", "Standings adjusted"
    PARTICIPANT_DISQUALIFIED = "contest.participant_disqualified", "Participant disqualified"

    # Editorials
    EDITORIAL_RELEASED = "editorial.released", "Editorial released"
    EDITORIAL_UNLOCKED = "editorial.unlocked", "Editorial unlocked for user"


class AuditLogManager(models.Manager["AuditLog"]):
    def record(
        self,
        *,
        action: str,
        actor: Any = None,
        target_type: str = "",
        target_id: str = "",
        summary: str = "",
        metadata: dict[str, Any] | None = None,
        ip_address: str | None = None,
        user_agent: str = "",
    ) -> AuditLog:
        """Write an entry.

        Call this inside the same transaction as the change it describes (§9:
        "Audit entries written in the same transaction as the change, so the
        change cannot exist without the record"). The `audited` helper in
        services.py does that for you.
        """
        return self.create(
            action=action,
            actor=actor,
            actor_label=str(actor) if actor else "system",
            target_type=target_type,
            target_id=str(target_id),
            summary=summary,
            metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent[:512],
        )


class AuditLog(UUIDPrimaryKeyModel):
    """One immutable record of one privileged action."""

    action = models.CharField(max_length=64, choices=AuditAction.choices, db_index=True)

    # SET_NULL, not CASCADE: deleting a user must never erase what they did.
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_entries",
    )
    # Denormalised so the entry stays readable after the actor row is gone.
    actor_label = models.CharField(max_length=255, blank=True)

    target_type = models.CharField(max_length=64, blank=True, db_index=True)
    target_id = models.CharField(max_length=64, blank=True, db_index=True)

    summary = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects: ClassVar[AuditLogManager] = AuditLogManager()

    class Meta:
        db_table = "audit_log"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["target_type", "target_id", "-created_at"]),
            models.Index(fields=["actor", "-created_at"]),
            models.Index(fields=["action", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.created_at:%Y-%m-%d %H:%M:%S} {self.action} by {self.actor_label}"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.pk and not self._state.adding:
            raise PermissionError("Audit entries are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> Any:
        raise PermissionError("Audit entries cannot be deleted.")
