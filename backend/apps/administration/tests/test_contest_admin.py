"""Tests for contest management in the admin API.

Covers the two behaviours the design doc ties to contests: scheduling edits
(`starts_at`/`ends_at`/`freeze_at`) are field edits and go through a dedicated
audited endpoint, while `state` stays read-only and can only move via
`transition_to` (§3.7, §7.3).
"""

from __future__ import annotations

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.audit.models import AuditAction, AuditLog
from apps.contests.models import Contest
from apps.problems.models import Difficulty, JudgingMode, Problem, ProblemVersion


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def admin_user(django_user_model):
    return django_user_model.objects.create_user(
        email="admin@example.com", username="boss", password="password", role=Role.ADMIN
    )


@pytest.fixture
def learner_user(django_user_model):
    return django_user_model.objects.create_user(
        email="learner@example.com", username="user1", password="password"
    )


def _make_contest(admin_user, slug="summer-cup", **overrides) -> Contest:
    start = timezone.now() + timezone.timedelta(days=1)
    return Contest.objects.create(
        slug=slug,
        title="Summer Cup",
        description="",
        starts_at=start,
        ends_at=start + timezone.timedelta(hours=3),
        owner=admin_user,
        is_public=False,
        **overrides,
    )


def _make_problem(admin_user) -> Problem:
    problem = Problem.objects.create(
        slug="echo",
        title="Echo",
        statement="Print the input.",
        difficulty=Difficulty.EASY,
        author=admin_user,
        is_public=True,
    )
    version = ProblemVersion.objects.create(
        problem=problem,
        version_number=1,
        judge_mode=JudgingMode.IO,
        created_by=admin_user,
        published_at=timezone.now(),
    )
    problem.current_version = version
    problem.save(update_fields=["current_version"])
    return problem


def test_contest_detail_shows_state_machine_and_problems(api, admin_user):
    contest = _make_contest(admin_user)
    api.force_authenticate(admin_user)

    resp = api.get(f"/api/v1/admin/contests/{contest.slug}/")

    assert resp.status_code == 200
    assert resp.data["state"] == "draft"
    assert resp.data["allowed_transitions"] == ["published"]
    assert resp.data["problems"] == []


def test_contest_update_modifies_times_and_audits(api, admin_user):
    contest = _make_contest(admin_user)
    api.force_authenticate(admin_user)
    new_end = (contest.ends_at + timezone.timedelta(hours=1)).isoformat()

    resp = api.patch(
        f"/api/v1/admin/contests/{contest.slug}/",
        {"ends_at": new_end, "expected_row_version": contest.row_version},
        format="json",
    )

    assert resp.status_code == 200
    contest.refresh_from_db()
    assert contest.ends_at.isoformat() == new_end
    assert contest.state == "draft"
    assert AuditLog.objects.filter(action=AuditAction.CONTEST_UPDATED).count() == 1
    entry = AuditLog.objects.get(action=AuditAction.CONTEST_UPDATED)
    assert entry.target_id == str(contest.pk)
    assert "ends_at" in entry.metadata["fields"]


def test_contest_update_rejects_ends_before_starts(api, admin_user):
    contest = _make_contest(admin_user)
    api.force_authenticate(admin_user)

    resp = api.patch(
        f"/api/v1/admin/contests/{contest.slug}/",
        {"ends_at": (contest.starts_at - timezone.timedelta(hours=1)).isoformat()},
        format="json",
    )

    assert resp.status_code == 400
    assert AuditLog.objects.filter(action=AuditAction.CONTEST_UPDATED).count() == 0


def test_contest_update_rejects_freeze_outside_window(api, admin_user):
    contest = _make_contest(admin_user)
    api.force_authenticate(admin_user)

    resp = api.patch(
        f"/api/v1/admin/contests/{contest.slug}/",
        {"freeze_at": (contest.ends_at + timezone.timedelta(hours=1)).isoformat()},
        format="json",
    )

    assert resp.status_code == 400


def test_contest_update_cannot_touch_state(api, admin_user):
    """§3.7: state moves via transition_to, never a direct field edit."""
    contest = _make_contest(admin_user)
    api.force_authenticate(admin_user)

    resp = api.patch(
        f"/api/v1/admin/contests/{contest.slug}/",
        {"state": "running"},
        format="json",
    )

    assert resp.status_code == 200
    contest.refresh_from_db()
    assert contest.state == "draft"


def test_contest_update_conflict_returns_409(api, admin_user):
    contest = _make_contest(admin_user)
    api.force_authenticate(admin_user)

    resp = api.patch(
        f"/api/v1/admin/contests/{contest.slug}/",
        {"title": "Stale write", "expected_row_version": contest.row_version + 10},
        format="json",
    )

    assert resp.status_code == 409


def test_contest_endpoints_require_admin(api, learner_user, admin_user):
    contest = _make_contest(admin_user)
    api.force_authenticate(learner_user)

    assert api.get(f"/api/v1/admin/contests/{contest.slug}/").status_code == 403
    assert api.patch(
        f"/api/v1/admin/contests/{contest.slug}/", {"title": "nope"}, format="json"
    ).status_code == 403


def test_attach_problem(api, admin_user):
    contest = _make_contest(admin_user)
    _make_problem(admin_user)
    api.force_authenticate(admin_user)

    resp = api.post(
        f"/api/v1/admin/contests/{contest.slug}/problems/",
        {"problem_slug": "echo", "label": "A", "order": 0, "points": 100},
        format="json",
    )

    assert resp.status_code == 201
    assert resp.data["problems"][0]["label"] == "A"
    assert resp.data["problems"][0]["version_number"] == 1
    assert AuditLog.objects.filter(action=AuditAction.CONTEST_PROBLEM_ADDED).count() == 1


def test_attach_unpublished_problem_rejected(api, admin_user):
    contest = _make_contest(admin_user)
    Problem.objects.create(
        slug="stub", title="Stub", statement="", difficulty=Difficulty.EASY,
        author=admin_user, is_public=False,
    )
    api.force_authenticate(admin_user)

    resp = api.post(
        f"/api/v1/admin/contests/{contest.slug}/problems/",
        {"problem_slug": "stub", "label": "A"},
        format="json",
    )

    assert resp.status_code == 400


def test_attach_duplicate_problem_or_label_rejected(api, admin_user):
    contest = _make_contest(admin_user)
    _make_problem(admin_user)
    api.force_authenticate(admin_user)

    api.post(
        f"/api/v1/admin/contests/{contest.slug}/problems/",
        {"problem_slug": "echo", "label": "A"},
        format="json",
    )
    dup_problem = api.post(
        f"/api/v1/admin/contests/{contest.slug}/problems/",
        {"problem_slug": "echo", "label": "B"},
        format="json",
    )
    dup_label = api.post(
        f"/api/v1/admin/contests/{contest.slug}/problems/",
        {"problem_slug": "echo", "label": "A"},
        format="json",
    )

    assert dup_problem.status_code == 400
    assert dup_label.status_code == 400


def test_attach_blocked_once_running(api, admin_user):
    contest = _make_contest(admin_user)
    _make_problem(admin_user)
    api.force_authenticate(admin_user)

    api.post(f"/api/v1/admin/contests/{contest.slug}/transition/", {"to_state": "published"})
    api.post(f"/api/v1/admin/contests/{contest.slug}/transition/", {"to_state": "running"})

    resp = api.post(
        f"/api/v1/admin/contests/{contest.slug}/problems/",
        {"problem_slug": "echo", "label": "A"},
        format="json",
    )

    assert resp.status_code == 400


def test_detach_problem(api, admin_user):
    contest = _make_contest(admin_user)
    _make_problem(admin_user)
    api.force_authenticate(admin_user)

    api.post(
        f"/api/v1/admin/contests/{contest.slug}/problems/",
        {"problem_slug": "echo", "label": "A"},
        format="json",
    )
    resp = api.delete(f"/api/v1/admin/contests/{contest.slug}/problems/?problem=echo")

    assert resp.status_code == 204
    detail = api.get(f"/api/v1/admin/contests/{contest.slug}/")
    assert detail.data["problems"] == []
    assert AuditLog.objects.filter(action=AuditAction.CONTEST_PROBLEM_REMOVED).count() == 1
