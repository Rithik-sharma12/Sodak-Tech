"""Django admin for progress and editorials — read-only inspection rows."""

from __future__ import annotations

from django.contrib import admin

from apps.progress.models import UserProblemProgress


@admin.register(UserProblemProgress)
class UserProblemProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "problem", "state", "best_score", "updated_at")
    list_filter = ("state",)
    search_fields = ("user__email", "problem__slug")
    readonly_fields = tuple(f.name for f in UserProblemProgress._meta.fields)
    has_add_permission = lambda self, request: False  # noqa: E731
    has_change_permission = lambda self, request, obj=None: False  # noqa: E731
    has_delete_permission = lambda self, request, obj=None: False  # noqa: E731
