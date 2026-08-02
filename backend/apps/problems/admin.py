"""Django admin for problems and test data.

§7.3: published versions are immutable and test data enters only through the
audited version-creation path. Test data models are therefore registered
read-only here — the Django admin exists to inspect rows, not to become a
second, un-audited path for hidden test data.
"""

from __future__ import annotations

from django.contrib import admin

from apps.problems.models import Problem, ProblemVersion, Tag, TestCase, TestGroup


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "description")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


class ProblemVersionInline(admin.StackedInline):
    model = ProblemVersion
    extra = 0
    can_delete = False
    readonly_fields = tuple(f.name for f in ProblemVersion._meta.fields)
    max_num = 0  # presentation only; creating versions goes through the API


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = (
        "title", "slug", "difficulty", "is_public", "is_submittable",
        "author", "solved_count", "attempt_count", "created_at",
    )
    list_filter = ("difficulty", "is_public")
    search_fields = ("title", "slug")
    autocomplete_fields = ("tags",)
    readonly_fields = (
        "id", "row_version", "solved_count", "attempt_count",
        "created_at", "updated_at",
    )
    inlines = [ProblemVersionInline]


@admin.register(ProblemVersion)
class ProblemVersionAdmin(admin.ModelAdmin):
    list_display = ("problem", "version_number", "judge_mode", "published_at", "created_at")
    list_filter = ("judge_mode", "comparison_mode")
    search_fields = ("problem__slug", "problem__title")
    # Immutable once published (enforced in save()) and, before that, test data
    # must still only arrive through the audited API path.
    readonly_fields = tuple(f.name for f in ProblemVersion._meta.fields)
    has_add_permission = lambda self, request: False  # noqa: E731


@admin.register(TestGroup)
class TestGroupAdmin(admin.ModelAdmin):
    list_display = ("problem_version", "name", "weight", "is_sample", "order")
    list_filter = ("is_sample",)
    search_fields = ("problem_version__problem__slug", "name")
    readonly_fields = tuple(f.name for f in TestGroup._meta.fields)
    has_add_permission = lambda self, request: False  # noqa: E731
    has_change_permission = lambda self, request, obj=None: False  # noqa: E731
    has_delete_permission = lambda self, request, obj=None: False  # noqa: E731


@admin.register(TestCase)
class TestCaseAdmin(admin.ModelAdmin):
    list_display = ("test_group", "order", "size_bytes", "input_sha256")
    search_fields = ("test_group__problem_version__problem__slug",)
    readonly_fields = tuple(f.name for f in TestCase._meta.fields)
    has_add_permission = lambda self, request: False  # noqa: E731
    has_change_permission = lambda self, request, obj=None: False  # noqa: E731
    has_delete_permission = lambda self, request, obj=None: False  # noqa: E731
