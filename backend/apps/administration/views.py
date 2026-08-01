"""Admin API.

Everything here is privileged. Three rules from the design doc govern the
module and are worth stating once:

  * §3.4 — roles are checked server-side per resource. "Hiding a control in the
    UI is not access control."
  * §9 — every privileged action writes an audit entry in the same transaction
    as the change, so the change cannot exist without the record.
  * §8.3 — reading hidden test data is itself an audited event.
"""

from __future__ import annotations

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import ListAPIView
from rest_framework.response import Response

from apps.accounts.models import Role
from apps.accounts.permissions import IsAdmin, IsProblemSetter, IsSuperAdmin
from apps.administration.serializers import (
    AdminContestSerializer,
    AdminProblemDetailSerializer,
    AdminProblemListSerializer,
    AdminTagSerializer,
    AdminUserSerializer,
    AuditLogSerializer,
    ContestTransitionSerializer,
    ProblemWriteSerializer,
    RoleChangeSerializer,
    VersionWriteSerializer,
)
from apps.audit.models import AuditAction, AuditLog
from apps.audit.services import audited
from apps.common.models import StaleWriteError
from apps.contests.models import Contest, InvalidTransition
from apps.problems.models import Problem, ProblemVersion, Tag, TestCase, TestGroup
from apps.submissions.models import Submission, Verdict

User = get_user_model()


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


@api_view(["GET"])
@permission_classes([IsAdmin])
def dashboard(request):
    """Counts for the admin landing page.

    Aggregated in the database rather than by loading rows — §3.3 of the stack
    doc treats per-request Python-side aggregation as the dominant backend
    defect in this framework.
    """
    now = timezone.now()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)

    user_stats = User.objects.aggregate(
        total=Count("id"),
        active=Count("id", filter=Q(is_active=True)),
        new_this_week=Count("id", filter=Q(created_at__gte=week_ago)),
    )
    problem_stats = Problem.objects.aggregate(
        total=Count("id"),
        published=Count("id", filter=Q(is_public=True, current_version__isnull=False)),
        drafts=Count("id", filter=Q(is_public=False)),
    )
    submission_stats = Submission.objects.aggregate(
        total=Count("id"),
        today=Count("id", filter=Q(received_at__gte=day_ago)),
        accepted=Count("id", filter=Q(verdict=Verdict.ACCEPTED)),
        pending=Count(
            "id",
            filter=Q(verdict__in=[Verdict.PENDING, Verdict.QUEUED, Verdict.RUNNING]),
        ),
    )
    contest_stats = Contest.objects.aggregate(
        total=Count("id"),
        running=Count("id", filter=Q(state__in=["running", "frozen"])),
        upcoming=Count("id", filter=Q(state="published")),
    )

    verdict_breakdown = list(
        Submission.objects.values("verdict").annotate(count=Count("id")).order_by("-count")[:10]
    )

    return Response(
        {
            "users": user_stats,
            "problems": problem_stats,
            "submissions": submission_stats,
            "contests": contest_stats,
            "verdict_breakdown": verdict_breakdown,
            "recent_activity": AuditLogSerializer(
                AuditLog.objects.select_related("actor")[:10], many=True
            ).data,
            "generated_at": now.isoformat(),
        }
    )


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class AdminUserListView(ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = User.objects.annotate(
            solved_count=Count(
                "progress", filter=Q(progress__state="solved"), distinct=True
            ),
            submission_count=Count("submissions", distinct=True),
        ).order_by("-created_at")

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(display_name__icontains=search)
            )
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        active = self.request.query_params.get("is_active")
        if active in {"true", "false"}:
            qs = qs.filter(is_active=active == "true")
        return qs


@api_view(["POST"])
@permission_classes([IsSuperAdmin])
def change_user_role(request, user_id):
    """Assign a role.

    Super Admin only — §3.4 denies role assignment to Admin. `can_assign_role`
    additionally refuses self-assignment, closing the escalation path §7.3
    calls out: "Users cannot modify their own role under any circumstances."
    """
    serializer = RoleChangeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    new_role = serializer.validated_data["role"]

    target = User.objects.filter(pk=user_id).first()
    if target is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if not request.user.can_assign_role(target, new_role):
        return Response(
            {"detail": "You cannot assign this role, or cannot change your own role."},
            status=status.HTTP_403_FORBIDDEN,
        )

    previous = target.role
    with audited(
        action=AuditAction.USER_ROLE_CHANGED,
        actor=request.user,
        target_type="user",
        target_id=str(target.pk),
        summary=f"{target.username}: {previous} -> {new_role}",
        request=request,
    ) as meta:
        target.role = new_role
        target.save(update_fields=["role", "updated_at"])
        meta["from"] = previous
        meta["to"] = new_role

    return Response(AdminUserSerializer(target).data)


@api_view(["POST"])
@permission_classes([IsAdmin])
def set_user_active(request, user_id):
    """Enable or disable an account.

    Deactivation, not deletion. §9 requires soft delete throughout: "Nothing
    with history attached is ever hard-deleted", and a user with submissions
    has history by definition.
    """
    target = User.objects.filter(pk=user_id).first()
    if target is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    if target.pk == request.user.pk:
        return Response(
            {"detail": "You cannot deactivate your own account."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if target.has_role_at_least(Role.ADMIN) and not request.user.is_super_admin:
        return Response(
            {"detail": "Only a Super Admin can deactivate an admin."},
            status=status.HTTP_403_FORBIDDEN,
        )

    is_active = bool(request.data.get("is_active", True))
    action = AuditAction.USER_ENABLED if is_active else AuditAction.USER_DISABLED

    with audited(
        action=action,
        actor=request.user,
        target_type="user",
        target_id=str(target.pk),
        summary=f"{target.username} {'enabled' if is_active else 'disabled'}",
        request=request,
    ):
        target.is_active = is_active
        target.save(update_fields=["is_active", "updated_at"])

    return Response(AdminUserSerializer(target).data)


# ---------------------------------------------------------------------------
# Problems
# ---------------------------------------------------------------------------


class AdminProblemListView(ListAPIView):
    serializer_class = AdminProblemListSerializer
    permission_classes = [IsProblemSetter]

    def get_queryset(self):
        qs = (
            Problem.objects.select_related("author")
            .prefetch_related("tags")
            .annotate(version_count=Count("versions", distinct=True))
            .order_by("-created_at")
        )
        # §3.4: a Problem Setter sees only their own; Admin sees all.
        if not self.request.user.is_admin:
            qs = qs.filter(author=self.request.user)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(slug__icontains=search))
        return qs


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsProblemSetter])
def admin_problem_detail(request, slug):
    problem = (
        Problem.objects.select_related("author")
        .prefetch_related("tags", "versions__test_groups__test_cases")
        .filter(slug=slug)
        .first()
    )
    if problem is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    # Ownership, checked on the row rather than the endpoint (§8.2).
    if not request.user.is_admin and problem.author_id != request.user.pk:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        # §8.3: this response includes hidden test data, so the read is audited.
        AuditLog.objects.record(
            action=AuditAction.TEST_DATA_READ,
            actor=request.user,
            target_type="problem",
            target_id=str(problem.pk),
            summary=f"Viewed test data for {problem.slug}",
        )
        return Response(AdminProblemDetailSerializer(problem).data)

    if request.method == "DELETE":
        with audited(
            action=AuditAction.PROBLEM_DELETED,
            actor=request.user,
            target_type="problem",
            target_id=str(problem.pk),
            summary=f"Soft-deleted {problem.slug}",
            request=request,
        ):
            problem.delete()  # soft delete; submissions keep resolving
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = ProblemWriteSerializer(problem, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    tag_slugs = data.pop("tag_slugs", None)
    expected = data.pop("expected_row_version", None)

    try:
        with audited(
            action=AuditAction.PROBLEM_UPDATED,
            actor=request.user,
            target_type="problem",
            target_id=str(problem.pk),
            summary=f"Updated {problem.slug}",
            request=request,
        ) as meta:
            if expected is not None:
                for field, value in data.items():
                    setattr(problem, field, value)
                problem.save_if_current(expected, list(data.keys()))
            else:
                for field, value in data.items():
                    setattr(problem, field, value)
                problem.save()
            if tag_slugs is not None:
                problem.tags.set(Tag.objects.filter(slug__in=tag_slugs))
            meta["fields"] = list(data.keys())
    except StaleWriteError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)

    problem.refresh_from_db()
    return Response(AdminProblemDetailSerializer(problem).data)


@api_view(["POST"])
@permission_classes([IsProblemSetter])
def create_problem(request):
    serializer = ProblemWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    tag_slugs = data.pop("tag_slugs", [])
    data.pop("expected_row_version", None)

    if not data.get("slug"):
        data["slug"] = slugify(data["title"])[:128]
    if Problem.all_objects.filter(slug=data["slug"]).exists():
        return Response(
            {"slug": ["A problem with this slug already exists."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with audited(
        action=AuditAction.PROBLEM_CREATED,
        actor=request.user,
        target_type="problem",
        target_id="",
        summary=f"Created {data['slug']}",
        request=request,
    ) as meta:
        problem = Problem.objects.create(author=request.user, **data)
        if tag_slugs:
            problem.tags.set(Tag.objects.filter(slug__in=tag_slugs))
        meta["problem_id"] = str(problem.pk)

    return Response(
        AdminProblemDetailSerializer(problem).data, status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsProblemSetter])
def create_version(request, slug):
    """Create a new problem version with its test set.

    This is the only path by which test data enters the system. Publishing sets
    the version as the problem's current one, which is what makes the problem
    submittable.
    """
    problem = Problem.objects.filter(slug=slug).first()
    if problem is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    if not request.user.is_admin and problem.author_id != request.user.pk:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = VersionWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    groups = data.pop("test_groups")
    publish = data.pop("publish")

    next_number = (
        ProblemVersion.objects.filter(problem=problem)
        .order_by("-version_number")
        .values_list("version_number", flat=True)
        .first()
        or 0
    ) + 1

    with audited(
        action=AuditAction.TEST_DATA_UPLOADED,
        actor=request.user,
        target_type="problem",
        target_id=str(problem.pk),
        summary=f"{problem.slug} v{next_number} created",
        request=request,
    ) as meta:
        version = ProblemVersion.objects.create(
            problem=problem,
            version_number=next_number,
            created_by=request.user,
            **data,
        )
        for order, group in enumerate(groups):
            tg = TestGroup.objects.create(
                problem_version=version,
                name=group["name"],
                description=group.get("description", ""),
                weight=group["weight"],
                is_sample=group["is_sample"],
                order=order,
            )
            TestCase.objects.bulk_create(
                [
                    TestCase(
                        test_group=tg,
                        order=i,
                        input_data=case.get("input", ""),
                        expected_output=case.get("expected_output", ""),
                    )
                    for i, case in enumerate(group["cases"])
                ]
            )

        if publish:
            version.published_at = timezone.now()
            version.save(update_fields=["published_at"])
            problem.current_version = version
            problem.save(update_fields=["current_version", "updated_at"])

        meta["version"] = next_number
        meta["published"] = publish
        meta["group_count"] = len(groups)

    return Response(
        AdminProblemDetailSerializer(
            Problem.objects.prefetch_related("versions__test_groups__test_cases").get(
                pk=problem.pk
            )
        ).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsProblemSetter])
def publish_version(request, slug, version_number):
    problem = Problem.objects.filter(slug=slug).first()
    if problem is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    if not request.user.is_admin and problem.author_id != request.user.pk:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    version = ProblemVersion.objects.filter(
        problem=problem, version_number=version_number
    ).first()
    if version is None:
        return Response({"detail": "Version not found."}, status=status.HTTP_404_NOT_FOUND)

    with audited(
        action=AuditAction.PROBLEM_VERSION_PUBLISHED,
        actor=request.user,
        target_type="problem",
        target_id=str(problem.pk),
        summary=f"Published {problem.slug} v{version_number}",
        request=request,
    ):
        if version.published_at is None:
            version.published_at = timezone.now()
            version.save(update_fields=["published_at"])
        problem.current_version = version
        problem.save(update_fields=["current_version", "updated_at"])

    return Response({"status": "published", "version": version_number})


# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------


@api_view(["GET", "POST"])
@permission_classes([IsProblemSetter])
def admin_tags(request):
    if request.method == "GET":
        tags = Tag.objects.annotate(problem_count=Count("problems")).order_by("name")
        return Response(AdminTagSerializer(tags, many=True).data)

    serializer = AdminTagSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    if not serializer.validated_data.get("slug"):
        serializer.validated_data["slug"] = slugify(serializer.validated_data["name"])
    tag = serializer.save()
    return Response(AdminTagSerializer(tag).data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAdmin])
def delete_tag(request, slug):
    tag = Tag.objects.filter(slug=slug).first()
    if tag is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    tag.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Contests
# ---------------------------------------------------------------------------


class AdminContestListView(ListAPIView):
    serializer_class = AdminContestSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return (
            Contest.objects.select_related("owner")
            .annotate(
                problem_count=Count("contest_problems", distinct=True),
                registration_count=Count("registrations", distinct=True),
            )
            .order_by("-starts_at")
        )


@api_view(["POST"])
@permission_classes([IsAdmin])
def create_contest(request):
    serializer = AdminContestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    with audited(
        action=AuditAction.CONTEST_CREATED,
        actor=request.user,
        target_type="contest",
        target_id="",
        summary=f"Created contest {serializer.validated_data.get('slug')}",
        request=request,
    ) as meta:
        contest = serializer.save(owner=request.user)
        meta["contest_id"] = str(contest.pk)

    return Response(AdminContestSerializer(contest).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAdmin])
def transition_contest(request, slug):
    """Move a contest through its lifecycle.

    §3.7 requires transitions to be explicit operations, never field edits, and
    §7.3 blocks direct state edits outright. The model validates against its
    adjacency map, so an impossible transition is rejected rather than applied.
    """
    contest = Contest.objects.filter(slug=slug).first()
    if contest is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ContestTransitionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    to_state = serializer.validated_data["to_state"]
    previous = contest.state

    try:
        with audited(
            action=AuditAction.CONTEST_STATE_CHANGED,
            actor=request.user,
            target_type="contest",
            target_id=str(contest.pk),
            summary=f"{contest.slug}: {previous} -> {to_state}",
            request=request,
        ) as meta:
            contest.transition_to(to_state, actor=request.user)
            meta["from"] = previous
            meta["to"] = to_state
    except InvalidTransition as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(AdminContestSerializer(contest).data)


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------


class AuditLogListView(ListAPIView):
    """Read-only by construction.

    §8.3: the log "is not deletable through the application by anyone,
    including Super Admin". There is deliberately no write or delete endpoint
    here, and a Postgres trigger enforces the same at the database level.
    """

    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = AuditLog.objects.select_related("actor").all()
        action = self.request.query_params.get("action")
        if action:
            qs = qs.filter(action=action)
        target_type = self.request.query_params.get("target_type")
        if target_type:
            qs = qs.filter(target_type=target_type)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(summary__icontains=search) | Q(actor_label__icontains=search))
        return qs


@api_view(["GET"])
@permission_classes([IsAdmin])
def system_health(request):
    """Operational signals for the admin panel.

    §9 asks for queue depth, verdict distribution, and sandbox termination
    reasons from day one. Queue depth is a placeholder until judging moves off
    the synchronous path.
    """
    from django.core.cache import cache
    from django.db import connection

    checks = {}
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks["database"] = "ok"
    except Exception as exc:  # noqa: BLE001
        checks["database"] = f"error: {exc.__class__.__name__}"

    try:
        cache.set("admin_health", "1", timeout=5)
        checks["cache"] = "ok" if cache.get("admin_health") == "1" else "degraded"
    except Exception as exc:  # noqa: BLE001
        checks["cache"] = f"degraded: {exc.__class__.__name__}"

    pending = Submission.objects.filter(
        verdict__in=[Verdict.PENDING, Verdict.QUEUED, Verdict.RUNNING]
    ).count()

    return Response(
        {
            "checks": checks,
            "queue_depth": pending,
            "judging_mode": "synchronous-unsandboxed",
            "judging_warning": (
                "Submissions execute in-process without a sandbox. Not suitable "
                "for untrusted users — see design doc §3.1 and §8.1."
            ),
            "verdict_distribution": list(
                Submission.objects.values("verdict")
                .annotate(count=Count("id"))
                .order_by("-count")
            ),
            "checked_at": timezone.now().isoformat(),
        }
    )
