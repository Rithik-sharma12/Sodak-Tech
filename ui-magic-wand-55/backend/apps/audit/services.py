"""Helpers for writing audit entries correctly.

The rule from SODAK-TECH-DESIGN.md §9 is that the entry and the change share a
transaction, "so the change cannot exist without the record". The context
manager below is the intended way to satisfy that.
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from django.db import transaction
from django.http import HttpRequest

from apps.audit.models import AuditLog


def client_ip(request: HttpRequest | None) -> str | None:
    if request is None:
        return None
    # X-Forwarded-For is only trustworthy because the load balancer rewrites it;
    # never trust it from an untrusted hop.
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@contextmanager
def audited(
    *,
    action: str,
    actor: Any = None,
    target_type: str = "",
    target_id: str = "",
    summary: str = "",
    metadata: dict[str, Any] | None = None,
    request: HttpRequest | None = None,
) -> Iterator[dict[str, Any]]:
    """Run a privileged change and its audit entry in one transaction.

    Yields a mutable dict that the caller can add to; whatever it holds at exit
    is merged into the entry's metadata. That lets a caller record values it
    only learns while doing the work, such as the number of rows a rejudge
    touched.

        with audited(action=AuditAction.REJUDGE_STARTED, actor=user,
                     target_type="problem", target_id=problem.id) as meta:
            count = queue_rejudge(problem)
            meta["submissions"] = count

    If the body raises, the transaction rolls back and neither the change nor
    the entry is committed -- which is the correct outcome. An audit entry for
    a change that did not happen is worse than none.
    """
    extra: dict[str, Any] = dict(metadata or {})

    with transaction.atomic():
        yield extra

        AuditLog.objects.record(
            action=action,
            actor=actor,
            target_type=target_type,
            target_id=target_id,
            summary=summary,
            metadata=extra,
            ip_address=client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", "") if request else "",
        )
