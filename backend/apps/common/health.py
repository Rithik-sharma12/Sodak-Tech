"""Health endpoints.

SODAK-TECH-STACK.md §4.4 is emphatic that these are different signals:

    Liveness  -- "is this process wedged?" Failure means restart. It checks
                 the process and nothing else. A liveness probe that touches
                 the database will restart every replica when the database
                 blips, converting a brief hiccup into a full outage.

    Readiness -- "should traffic route here?" It checks dependencies. Failure
                 removes the instance from rotation; it recovers on its own.

Keep the asymmetry. It is the whole point.
"""

from __future__ import annotations

from django.core.cache import cache
from django.db import connection
from django.http import HttpRequest, JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET


@require_GET
@never_cache
def liveness(request: HttpRequest) -> JsonResponse:
    """Process-local only. Never touches a dependency."""
    return JsonResponse({"status": "alive"})


@require_GET
@never_cache
def readiness(request: HttpRequest) -> JsonResponse:
    """Dependency check. A failure here sheds traffic, it does not restart."""
    checks: dict[str, str] = {}
    ok = True

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks["database"] = "ok"
    except Exception as exc:  # noqa: BLE001 -- the reason is reported, not raised
        checks["database"] = f"error: {exc.__class__.__name__}"
        ok = False

    # The cache is reconstructible, so its absence degrades rather than fails
    # (§4.8: "Serve from database; slower, fully functional"). It is reported
    # but does not gate readiness.
    try:
        cache.set("healthz", "1", timeout=5)
        checks["cache"] = "ok" if cache.get("healthz") == "1" else "degraded"
    except Exception as exc:  # noqa: BLE001
        checks["cache"] = f"degraded: {exc.__class__.__name__}"

    return JsonResponse({"status": "ready" if ok else "not_ready", "checks": checks},
                        status=200 if ok else 503)
