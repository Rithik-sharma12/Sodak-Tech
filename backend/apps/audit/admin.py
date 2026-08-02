"""Django admin for the append-only audit log.

Read-only by construction — §8.3 forbids editing or deleting entries by anyone,
including Super Admin, and the model itself raises PermissionError on save and
delete. Disabling the admin actions too keeps the failure explicit rather than
an error page.
"""

from __future__ import annotations

from django.contrib import admin

from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "actor_label", "target_type", "target_id", "summary")
    list_filter = ("action", "target_type")
    search_fields = ("summary", "actor_label", "target_id", "ip_address")
    readonly_fields = tuple(f.name for f in AuditLog._meta.fields)

    def has_add_permission(self, request):  # noqa: ANN001
        return False

    def has_change_permission(self, request, obj=None):  # noqa: ANN001
        return False

    def has_delete_permission(self, request, obj=None):  # noqa: ANN001
        return False
