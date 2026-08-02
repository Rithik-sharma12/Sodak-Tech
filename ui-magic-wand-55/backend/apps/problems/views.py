"""Problem endpoints."""

from __future__ import annotations

from django.conf import settings
from django.db.models import Prefetch, QuerySet
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.common.pagination import SmallPageNumberPagination
from apps.problems.models import Problem, Tag
from apps.problems.serializers import (
    ProblemDetailSerializer,
    ProblemListSerializer,
    TagSerializer,
)


class ProblemListView(generics.ListAPIView):
    serializer_class = ProblemListSerializer
    pagination_class = SmallPageNumberPagination
    # Problem statements are public content. SODAK-TECH-STACK.md §2.2: "problem
    # statements are public content, and a coding platform's growth depends on
    # those pages being indexable and fast on first paint."
    #
    # Only published, public problems are in the queryset, and per-user fields
    # (progress_state) degrade to a default for anonymous callers. Contest
    # problems are a separate path and stay unreadable until start (§8.5).
    permission_classes = [AllowAny]

    def get_queryset(self) -> QuerySet[Problem]:
        qs = (
            Problem.objects.filter(is_public=True)
            .exclude(current_version__isnull=True)
            .prefetch_related(Prefetch("tags", queryset=Tag.objects.only("slug", "name")))
            .select_related("current_version")
        )

        params = self.request.query_params

        if search := params.get("search"):
            qs = qs.filter(title__icontains=search)
        if difficulty := params.get("difficulty"):
            if difficulty != "all":
                qs = qs.filter(difficulty=difficulty)
        if tags := params.getlist("tags"):
            qs = qs.filter(tags__slug__in=tags).distinct()

        return qs.order_by("created_at")

    def get_serializer_context(self) -> dict:
        """Build the progress map in one query, not one per row.

        §3.3 of the stack doc requires eager loading on every list endpoint and
        a query-count assertion in tests so regressions fail CI. This is the
        eager half.
        """
        context = super().get_serializer_context()
        progress_map: dict = {}

        if self.request.user.is_authenticated:
            from apps.progress.models import UserProblemProgress

            rows = UserProblemProgress.objects.filter(user=self.request.user).values_list(
                "problem_id", "state"
            )
            progress_map = dict(rows)

        context["progress_map"] = progress_map
        return context


class ProblemDetailView(generics.RetrieveAPIView):
    serializer_class = ProblemDetailSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]  # public content -- see ProblemListView

    def get_queryset(self) -> QuerySet[Problem]:
        return (
            Problem.objects.filter(is_public=True)
            .prefetch_related("tags")
            .select_related("current_version")
        )

    def get_serializer_context(self) -> dict:
        context = super().get_serializer_context()
        problem = self.get_object()

        progress_map = {}
        unlocked = False

        if self.request.user.is_authenticated:
            from apps.progress.models import UserProblemProgress

            progress = UserProblemProgress.objects.filter(
                user=self.request.user, problem=problem
            ).first()
            if progress:
                progress_map[problem.id] = progress.state

            editorial = getattr(problem, "editorial", None)
            if editorial is not None:
                # §8.5: locked down entirely while the problem is in a running
                # contest, regardless of what the user has otherwise earned.
                if not editorial.is_locked_by_active_contest:
                    unlocked, _reason = editorial.is_unlocked_for(self.request.user, progress)

        context["progress_map"] = progress_map
        context["editorial_unlocked"] = unlocked
        return context


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def editorial(request: Request, slug: str) -> Response:
    """Editorial content, behind its own authorization check.

    §3.6: "Editorial content must never appear in the response for a locked
    problem. It is served from a dedicated endpoint that performs its own
    authorization and returns a denial otherwise."

    So this re-evaluates the unlock conditions rather than trusting the
    `editorial_unlocked` flag the detail endpoint returned. That flag is a UI
    hint; this is the gate.
    """
    from apps.progress.models import UserProblemProgress

    problem = Problem.objects.filter(slug=slug, is_public=True).first()
    if problem is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    editorial_obj = getattr(problem, "editorial", None)
    if editorial_obj is None:
        return Response(
            {"detail": "No editorial for this problem."}, status=status.HTTP_404_NOT_FOUND
        )

    if editorial_obj.is_locked_by_active_contest:
        return Response(
            {"detail": "Editorials are locked while this problem is in a running contest.",
             "locked": True, "reason": "active_contest"},
            status=status.HTTP_403_FORBIDDEN,
        )

    progress = UserProblemProgress.objects.filter(
        user=request.user, problem=problem
    ).first()
    unlocked, reason = editorial_obj.is_unlocked_for(request.user, progress)

    if not unlocked:
        # The denial explains what *would* unlock it without leaking any of it.
        return Response(
            {
                "detail": "This editorial is locked.",
                "locked": True,
                "reason": reason,
                "attempts_made": progress.genuine_attempt_count if progress else 0,
                "attempts_required": settings.EDITORIAL_UNLOCK_ATTEMPTS,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # §3.6: "The unlock event is recorded before content is returned."
    if progress is not None:
        progress.mark_editorial_viewed()

    return Response({"content": editorial_obj.content, "locked": False})


@api_view(["GET"])
@permission_classes([AllowAny])
def tags(request: Request) -> Response:
    return Response(TagSerializer(Tag.objects.all(), many=True).data)
