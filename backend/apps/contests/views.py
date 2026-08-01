"""Contest endpoints.

Every payload carries `server_time`. §7.2: "Client clock skew -- countdown
derived from a server-provided time offset, never the browser clock." The
frontend must compute its offset once and use it for every countdown, so a
wrong or deliberately altered browser clock cannot change what the contest
does.
"""

from __future__ import annotations

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.contests.models import Contest, ContestState, Registration


def _serialise(contest: Contest, *, registered: bool) -> dict:
    return {
        "id": str(contest.id),
        "slug": contest.slug,
        "title": contest.title,
        "description": contest.description,
        "state": contest.state,
        "starts_at": contest.starts_at.isoformat(),
        "ends_at": contest.ends_at.isoformat(),
        "duration_minutes": int(
            (contest.ends_at - contest.starts_at).total_seconds() // 60
        ),
        "is_rated": contest.is_rated,
        "problem_count": contest.contest_problems.count(),
        "participant_count": contest.registrations.count(),
        "registered": registered,
        # §8.5: problems are unreadable until the start time, and this is
        # evaluated server-side on every fetch.
        "problems_readable": contest.problems_are_readable,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def contest_list(request: Request) -> Response:
    contests = (
        Contest.objects.filter(is_public=True)
        .exclude(state=ContestState.DRAFT)
        .prefetch_related("contest_problems", "registrations")
        .order_by("-starts_at")
    )

    registered_ids = set(
        Registration.objects.filter(user=request.user).values_list("contest_id", flat=True)
    )

    return Response(
        {
            "server_time": timezone.now().isoformat(),
            "results": [
                _serialise(c, registered=c.id in registered_ids) for c in contests
            ],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def contest_detail(request: Request, slug: str) -> Response:
    contest = Contest.objects.filter(slug=slug, is_public=True).first()
    if contest is None:
        return Response({"detail": "Not found."}, status=404)

    registered = Registration.objects.filter(
        user=request.user, contest=contest
    ).exists()

    payload = _serialise(contest, registered=registered)
    payload["server_time"] = timezone.now().isoformat()
    return Response(payload)
