"""Base models shared across apps.

Two policies from the design docs are enforced here rather than repeated in
every app:

  * Soft delete throughout. SODAK-TECH-DESIGN.md §9: "Nothing with history
    attached is ever hard-deleted." A problem with submissions against it must
    remain resolvable forever, or the submission history becomes unreadable.

  * Optimistic concurrency. §7.3: two setters editing one problem must produce
    a conflict, "never silent overwrite".
"""

from __future__ import annotations

import uuid
from typing import Any

from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    """QuerySet whose delete() marks rows instead of removing them."""

    def delete(self, *, hard: bool = False) -> tuple[int, dict[str, int]]:
        if hard:
            return super().delete()
        count = self.update(deleted_at=timezone.now())
        return count, {self.model._meta.label: count}

    def alive(self) -> SoftDeleteQuerySet:
        return self.filter(deleted_at__isnull=True)

    def dead(self) -> SoftDeleteQuerySet:
        return self.filter(deleted_at__isnull=False)


class AliveManager(models.Manager.from_queryset(SoftDeleteQuerySet)):  # type: ignore[misc]
    """Default manager: soft-deleted rows are invisible.

    `objects` hides deleted rows so that no query has to remember to exclude
    them -- forgetting is the failure mode this guards against. Use
    `all_objects` when history genuinely matters, such as rendering an old
    submission against a withdrawn problem.
    """

    def get_queryset(self) -> SoftDeleteQuerySet:
        return super().get_queryset().filter(deleted_at__isnull=True)


class AllObjectsManager(models.Manager.from_queryset(SoftDeleteQuerySet)):  # type: ignore[misc]
    """Manager that sees soft-deleted rows too."""


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = AliveManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def delete(self, *args: Any, hard: bool = False, **kwargs: Any) -> Any:
        if hard:
            return super().delete(*args, **kwargs)
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at", "updated_at"])
        return 1, {self._meta.label: 1}

    def restore(self) -> None:
        self.deleted_at = None
        self.save(update_fields=["deleted_at", "updated_at"])


class UUIDPrimaryKeyModel(models.Model):
    """UUID primary key.

    Used wherever an identifier is exposed in a URL. Sequential integers leak
    row counts and make enumeration trivial, which matters on a platform whose
    §8.2 threat model names direct object reference flaws as "the most common
    defect in this class of platform".
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class StaleWriteError(Exception):
    """Raised when a write is based on a version the row has moved past."""


class VersionedModel(models.Model):
    """Optimistic concurrency via a monotonically increasing row version.

    A writer reads `row_version`, then calls `save_if_current(expected)`. If
    another writer committed in between, the update matches zero rows and this
    raises rather than silently discarding their work (§7.3).
    """

    row_version = models.PositiveIntegerField(default=1)

    class Meta:
        abstract = True

    def save_if_current(self, expected_version: int, update_fields: list[str]) -> None:
        fields = {f: getattr(self, f) for f in update_fields}
        fields["row_version"] = expected_version + 1

        updated = (
            type(self)
            ._default_manager.filter(pk=self.pk, row_version=expected_version)
            .update(**fields)
        )
        if updated == 0:
            raise StaleWriteError(
                f"{type(self).__name__} {self.pk} was modified by another writer; "
                f"expected row_version {expected_version}"
            )
        self.row_version = expected_version + 1
