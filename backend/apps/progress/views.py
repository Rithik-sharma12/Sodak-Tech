"""Progress and leaderboard endpoints."""

from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.problems.models import Difficulty, Problem
from apps.progress.models import ProgressState, UserProblemProgress
from apps.submissions.models import Submission, Verdict


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_progress(request: Request) -> Response:
    """The dashboard payload.

    Every count here is a single aggregate query. §3.3 of the stack doc wants
    expensive aggregates materialised on a schedule rather than computed per
    request -- at demo scale these are cheap, but the shape is kept aggregate-
    friendly so moving them to a periodic job later is a change of source, not
    of contract.
    """
    user = request.user

    progress_rows = UserProblemProgress.objects.filter(user=user)
    solved = progress_rows.filter(state=ProgressState.SOLVED).count()
    attempted = progress_rows.exclude(state=ProgressState.NOT_ATTEMPTED).count()

    submissions = Submission.objects.filter(user=user, kind="submit")
    total_subs = submissions.count()
    accepted_subs = submissions.filter(verdict=Verdict.ACCEPTED).count()

    # Solved and total per difficulty, in two queries rather than six.
    totals_by_difficulty = dict(
        Problem.objects.filter(is_public=True)
        .values_list("difficulty")
        .annotate(n=Count("id"))
    )
    solved_by_difficulty = dict(
        progress_rows.filter(state=ProgressState.SOLVED)
        .values_list("problem__difficulty")
        .annotate(n=Count("id"))
    )
    by_difficulty = {
        d: {
            "solved": solved_by_difficulty.get(d, 0),
            "total": totals_by_difficulty.get(d, 0),
        }
        for d in Difficulty.values
    }

    by_tag = [
        {
            "tag": row["problem__tags__name"],
            "solved": row["solved"],
            "total": row["total"],
            "mastery": row["mastered"] > 0,
        }
        for row in progress_rows.filter(problem__tags__isnull=False)
        .values("problem__tags__name")
        .annotate(
            solved=Count("id", filter=Q(state=ProgressState.SOLVED)),
            total=Count("id"),
            mastered=Count("id", filter=Q(has_mastery=True)),
        )
        .order_by("-solved")
    ]

    since = timezone.now() - timedelta(days=365)
    activity = [
        {"date": row["day"].date().isoformat(), "count": row["n"]}
        for row in submissions.filter(received_at__gte=since)
        .extra({"day": "date_trunc('day', received_at)"})  # noqa: S610
        .values("day")
        .annotate(n=Count("id"))
        .order_by("day")
    ]

    return Response(
        {
            "problems_solved": solved,
            "problems_attempted": attempted,
            "acceptance_rate": round(accepted_subs / total_subs, 4) if total_subs else 0.0,
            "current_streak": _current_streak(activity),
            "total_submissions": total_subs,
            "by_difficulty": by_difficulty,
            "by_tag": by_tag,
            "activity": activity,
        }
    )


def _current_streak(activity: list[dict]) -> int:
    """Consecutive days ending today or yesterday.

    Yesterday counts so that a streak is not broken merely because the user has
    not submitted yet today.
    """
    if not activity:
        return 0

    days = {row["date"] for row in activity if row["count"] > 0}
    today = timezone.now().date()

    if today.isoformat() not in days and (today - timedelta(days=1)).isoformat() not in days:
        return 0

    streak = 0
    cursor = today if today.isoformat() in days else today - timedelta(days=1)
    while cursor.isoformat() in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def leaderboard(request: Request) -> Response:
    """Global standings by solved count, then rating."""
    limit = min(int(request.query_params.get("limit", 50)), 200)

    rows = (
        User.objects.filter(is_active=True)
        .annotate(
            solved=Count(
                "progress", filter=Q(progress__state=ProgressState.SOLVED), distinct=True
            )
        )
        .order_by("-solved", "-rating", "username")[:limit]
    )

    return Response(
        [
            {
                "rank": index + 1,
                "user_id": str(u.id),
                "username": u.username,
                "display_name": u.display_name or u.username,
                "score": u.rating,
                "problems_solved": u.solved,
                "is_current_user": u.id == request.user.id,
            }
            for index, u in enumerate(rows)
        ]
    )
