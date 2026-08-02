"""Django admin for editorials.

`content` is read-only here too — the only sanctioned paths to it are the gated
detail endpoint (§3.6) and admin inspection.
"""

from __future__ import annotations

from django.contrib import admin

from apps.editorials.models import Editorial


@admin.register(Editorial)
class EditorialAdmin(admin.ModelAdmin):
    list_display = ("problem", "author", "released_at", "created_at")
    search_fields = ("problem__slug", "problem__title")
    list_filter = ("released_at",)
    readonly_fields = ("id", "problem", "author", "created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("problem", "author")}),
        ("Content", {"fields": ("content",)}),
        ("Release", {"fields": ("released_at", "created_at", "updated_at")}),
    )
