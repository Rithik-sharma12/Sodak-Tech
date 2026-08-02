"""Django admin for users.

Safety-net surface (§8.3): inspecting a row, resetting a password. Role and
activity fields are read-only so privileged operations stay on the audited API
path rather than bypassing the audit log. Passwords use the standard hashed
field widget, never a raw text input.
"""

from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField, UserChangeForm

from apps.accounts.models import User


class UserChangeFormWithHash(UserChangeForm):
    password = ReadOnlyPasswordHashField(
        help_text=(
            "Raw passwords are not stored. Change it via the audited "
            "password endpoint or the 'This form' link below."
        )
    )


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    form = UserChangeFormWithHash
    ordering = ("-created_at",)
    search_fields = ("email", "username", "display_name")
    list_display = (
        "email", "username", "display_name", "role", "is_active", "is_staff",
        "created_at",
    )
    list_filter = ("role", "is_active", "is_staff")
    readonly_fields = (
        "id", "rating", "peak_rating", "rated_contest_count",
        "last_login_at", "last_reauth_at", "created_at", "updated_at",
    )
    fieldsets = (
        (None, {"fields": ("email", "username", "display_name", "password")}),
        (
            "Access",
            {
                "fields": (
                    "role", "is_active", "is_staff", "is_superuser",
                    "groups", "user_permissions", "mfa_enabled",
                )
            },
        ),
        (
            "Ratings",
            {"fields": ("rating", "peak_rating", "rated_contest_count")},
        ),
        ("History", {"fields": ("last_login_at", "last_reauth_at", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "display_name", "password1", "password2"),
            },
        ),
    )
