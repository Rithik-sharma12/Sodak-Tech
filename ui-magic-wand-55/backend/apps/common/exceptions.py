"""Uniform API error shape.

Two rules from the docs shape this:

  * §4.1 -- when the platform sheds load it must say so honestly, "with a clear,
    honest message and a retry indication -- not silently queued into a hole."
  * §8.2 -- error responses must not leak whether a resource exists to someone
    not authorised to see it.
"""

from __future__ import annotations

from typing import Any

from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from apps.common.models import StaleWriteError


class ServiceOverloaded(Exception):
    """Raised when a bounded queue is at its depth cap.

    Rejecting work under overload is a feature (§4.1). Accepting work that
    cannot be completed is how an outage becomes data loss.
    """

    def __init__(self, message: str, retry_after: int = 30) -> None:
        super().__init__(message)
        self.retry_after = retry_after


class SubmissionRejected(Exception):
    """Raised when a submission fails validation before it costs a worker."""


def exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, ServiceOverloaded):
        response = Response(
            {
                "error": "service_overloaded",
                "detail": str(exc),
                "retry_after": exc.retry_after,
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
        response["Retry-After"] = str(exc.retry_after)
        return response

    if isinstance(exc, StaleWriteError):
        return Response(
            {
                "error": "stale_write",
                "detail": (
                    "This record was modified by someone else since you loaded it. "
                    "Reload and reapply your changes."
                ),
            },
            status=status.HTTP_409_CONFLICT,
        )

    if isinstance(exc, SubmissionRejected):
        return Response(
            {"error": "submission_rejected", "detail": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # §8.2: an unauthorised request for a resource that exists and one for a
    # resource that does not must be indistinguishable, or the error itself
    # becomes an existence oracle.
    if isinstance(exc, PermissionDenied | Http404):
        return Response(
            {"error": "not_found", "detail": "Not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return drf_exception_handler(exc, context)
