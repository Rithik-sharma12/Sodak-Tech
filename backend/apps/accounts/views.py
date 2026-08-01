"""Authentication endpoints.

Session-cookie auth, not tokens in browser storage. §5.1: "Authentication tokens
in HTTP-only, secure, same-site cookies -- never in browser storage, which is
readable by any injected script." On a platform that renders untrusted user
code in a submission viewer, that distinction is load-bearing.
"""

from __future__ import annotations

from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.accounts.serializers import LoginSerializer, UserSerializer


class AuthThrottle(ScopedRateThrottle):
    scope = "auth"


@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request: Request) -> Response:
    """Hand the SPA a CSRF cookie before it attempts any write.

    The frontend calls this once on load. Django sets the `csrftoken` cookie as
    a side effect of get_token(); the client echoes it back in the X-CSRFToken
    header on every unsafe method.
    """
    return Response({"csrftoken": get_token(request)})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def login_view(request: Request) -> Response:
    serializer = LoginSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)

    user = serializer.validated_data["user"]
    login(request, user)

    # §8.3: privileged sessions expire sooner than learner sessions.
    request.session.set_expiry(user.session_max_age)

    user.last_login_at = timezone.now()
    user.last_reauth_at = timezone.now()
    user.save(update_fields=["last_login_at", "last_reauth_at", "updated_at"])

    # NOTE: §8.3 requires MFA to be *enforced* for Admin and above before
    # launch. It is not implemented yet, so a privileged account currently
    # completes login on password alone. Tracked as a launch blocker.
    return Response(UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request: Request) -> Response:
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request: Request) -> Response:
    from apps.progress.models import ProgressState, UserProblemProgress
    from apps.submissions.models import Submission

    solved = UserProblemProgress.objects.filter(
        user=request.user, state=ProgressState.SOLVED
    ).count()
    total = Submission.objects.filter(user=request.user).count()

    return Response(
        UserSerializer(
            request.user,
            context={"problems_solved": solved, "total_submissions": total},
        ).data
    )
