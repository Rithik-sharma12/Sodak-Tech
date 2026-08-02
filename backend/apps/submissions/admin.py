"""Django admin for submissions.

Submissions are evidence: source is read-only so a verdict can always be
explained from the exact bytes that produced it.
"""

from __future__ import annotations

from django.contrib import admin

from apps.submissions.models import Submission, SubmissionResult


class SubmissionResultInline(admin.TabularInline):
    model = SubmissionResult
    extra = 0
    can_delete = False
    readonly_fields = tuple(f.name for f in SubmissionResult._meta.fields)
    max_num = 0


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "problem", "language", "kind", "verdict", "score", "received_at")
    list_filter = ("verdict", "language", "kind")
    search_fields = ("user__email", "problem__slug", "id")
    readonly_fields = tuple(f.name for f in Submission._meta.fields)
    has_add_permission = lambda self, request: False  # noqa: E731
    has_change_permission = lambda self, request, obj=None: False  # noqa: E731
    has_delete_permission = lambda self, request, obj=None: False  # noqa: E731
    inlines = [SubmissionResultInline]
