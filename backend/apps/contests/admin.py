"""Django admin for contests.

§3.7: lifecycle changes go through `transition_to` only, so `state` is
read-only here. Scheduling fields (`starts_at`/`ends_at`/`freeze_at`) remain
editable — the documented way to extend a contest after an incident (§7.2) —
but every change there is the same field edit an ops action would make.
"""

from __future__ import annotations

from django.contrib import admin

from apps.contests.models import Contest, ContestProblem, Registration


class ContestProblemInline(admin.TabularInline):
    model = ContestProblem
    extra = 0
    can_delete = False
    readonly_fields = ("id", "problem", "problem_version", "label", "order", "points")


@admin.register(Contest)
class ContestAdmin(admin.ModelAdmin):
    list_display = (
        "title", "slug", "state", "starts_at", "ends_at", "is_public", "is_rated", "owner",
    )
    list_filter = ("state", "is_public", "is_rated", "scoring_mode")
    search_fields = ("title", "slug")
    readonly_fields = (
        "id", "row_version", "state", "resume_state",
        "paused_duration_seconds", "paused_at", "created_at", "updated_at",
    )
    inlines = [ContestProblemInline]


@admin.register(ContestProblem)
class ContestProblemAdmin(admin.ModelAdmin):
    list_display = ("contest", "label", "problem", "problem_version", "order", "points")
    list_filter = ("contest__state",)
    search_fields = ("contest__slug", "problem__slug", "label")
    readonly_fields = ("id", "contest", "problem", "problem_version")
    has_add_permission = lambda self, request: False  # noqa: E731
    has_change_permission = lambda self, request, obj=None: False  # noqa: E731
    has_delete_permission = lambda self, request, obj=None: False  # noqa: E731


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ("contest", "user", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("contest__slug", "user__email")
    readonly_fields = (
        "id", "contest", "user", "virtual_started_at", "rating_before", "rating_after",
    )
