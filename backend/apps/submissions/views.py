"""Submission endpoints."""

from __future__ import annotations

from django.conf import settings
from django.db import transaction
from django.db.models import QuerySet
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.common.exceptions import ServiceOverloaded
from apps.common.pagination import CursorSetPagination
from apps.submissions.models import Submission, SubmissionKind, Verdict
from apps.submissions.serializers import SubmissionCreateSerializer, SubmissionSerializer


class SubmissionListView(generics.ListAPIView):
    serializer_class = SubmissionSerializer
    pagination_class = CursorSetPagination

    def get_queryset(self) -> QuerySet[Submission]:
        """Scoped to the requesting user.

        §8.2: ownership is verified on the queryset, not by trusting a user id
        from the client. A `?user=` parameter here would be the direct object
        reference flaw the design doc calls the most common defect in this
        class of platform.
        """
        qs = (
            Submission.objects.filter(user=self.request.user)
            .select_related("problem")
            .prefetch_related("results__test_group")
        )

        # Runs are trials against sample tests, not submissions of record. They
        # are already excluded from progress and from the editorial-unlock
        # attempt count, so showing them in history would be the one place a
        # user's experimenting leaves a visible trace.
        if self.request.query_params.get("include_runs") != "true":
            qs = qs.filter(kind=SubmissionKind.SUBMIT)

        if slug := self.request.query_params.get("problem"):
            qs = qs.filter(problem__slug=slug)
        return qs.order_by("-received_at")


class SubmissionDetailView(generics.RetrieveAPIView):
    serializer_class = SubmissionSerializer

    def get_queryset(self) -> QuerySet[Submission]:
        return (
            Submission.objects.filter(user=self.request.user)
            .select_related("problem")
            .prefetch_related("results__test_group")
        )


def _check_inflight_cap(user) -> None:  # noqa: ANN001
    """§4.1: per-user in-flight cap, so one user cannot consume the queue."""
    inflight = Submission.objects.filter(
        user=user,
        verdict__in=[Verdict.PENDING, Verdict.QUEUED, Verdict.COMPILING, Verdict.RUNNING],
    ).count()

    if inflight >= settings.MAX_INFLIGHT_SUBMISSIONS_PER_USER:
        raise ServiceOverloaded(
            f"You already have {inflight} submissions being judged. "
            f"Wait for one to finish before submitting again.",
            retry_after=10,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_submission(request: Request) -> Response:
    """Accept a submission and queue it for judging.

    The ordering matters and follows §3.2: validate, persist as pending, then
    enqueue. Persisting before enqueuing means a crash between the two leaves a
    recoverable pending row rather than a job referencing nothing.
    """
    serializer = SubmissionCreateSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    problem = serializer.context["problem"]

    # §7.1: a repeat of the same key returns the existing submission rather
    # than creating a second one. Checked before the in-flight cap so that a
    # double-click is never punished as if it were two submissions.
    existing = Submission.objects.filter(
        user=request.user, idempotency_key=data["idempotency_key"]
    ).first()
    if existing is not None:
        return Response(
            SubmissionSerializer(existing).data, status=status.HTTP_200_OK
        )

    _check_inflight_cap(request.user)

    with transaction.atomic():
        submission = Submission.objects.create(
            user=request.user,
            problem=problem,
            problem_version=problem.current_version,
            kind=data["kind"],
            language=data["language"],
            source_code=data["source_code"],
            source_bytes=len(data["source_code"].encode("utf-8")),
            idempotency_key=data["idempotency_key"],
            verdict=Verdict.QUEUED,
        )

    # Judge inline for the demo. The real path enqueues to an isolated worker
    # pool -- see the note in apps/judging/local_judge.py about why this stub
    # is not the judge.
    from apps.judging.local_judge import judge_submission

    judge_submission(submission)
    submission.refresh_from_db()

    return Response(
        SubmissionSerializer(submission).data, status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def submission_status(request: Request, pk: str) -> Response:
    """Lightweight poll target for the editor's post-submit state."""
    submission = Submission.objects.filter(user=request.user, pk=pk).first()
    if submission is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    return Response(
        {
            "id": str(submission.id),
            "verdict": submission.verdict,
            "score": str(submission.score),
            "is_terminal": submission.is_terminal,
        }
    )


__all__ = [
    "SubmissionListView",
    "SubmissionDetailView",
    "create_submission",
    "submission_status",
    "SubmissionKind",
]
