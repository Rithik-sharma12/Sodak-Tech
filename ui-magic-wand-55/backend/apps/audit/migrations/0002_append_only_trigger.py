"""Enforce the append-only audit log at the database level.

SODAK-TECH-DESIGN.md §8.3: "The audit log is not deletable through the
application by anyone, including Super Admin. Append-only, no deletion path."

The model's save()/delete() overrides are necessary but not sufficient --
QuerySet.update() and QuerySet.delete() never call them, so a stray
`AuditLog.objects.filter(...).delete()` would succeed with only the Python
guard in place. The trigger closes that, and also covers psql sessions and
anything else that reaches the table directly.

Note this binds the *application* role. A migration role (§5.3: "The
application connects with a role that has no schema-modification rights.
Migrations run under a separate role") must retain the ability to drop the
trigger, or this migration becomes irreversible in a way that blocks future
schema changes.
"""

from django.db import migrations

FORWARD = """
CREATE OR REPLACE FUNCTION audit_log_append_only()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'audit_log is append-only: % is not permitted (design doc section 8.3)',
        TG_OP
        USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();

CREATE TRIGGER audit_log_no_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();

-- TRUNCATE bypasses row-level triggers entirely, so it needs its own
-- statement-level guard. This is the gap most append-only implementations miss.
CREATE TRIGGER audit_log_no_truncate
    BEFORE TRUNCATE ON audit_log
    FOR EACH STATEMENT EXECUTE FUNCTION audit_log_append_only();
"""

REVERSE = """
DROP TRIGGER IF EXISTS audit_log_no_truncate ON audit_log;
DROP TRIGGER IF EXISTS audit_log_no_delete ON audit_log;
DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
DROP FUNCTION IF EXISTS audit_log_append_only();
"""


class Migration(migrations.Migration):
    dependencies = [("audit", "0001_initial")]

    operations = [migrations.RunSQL(sql=FORWARD, reverse_sql=REVERSE)]
