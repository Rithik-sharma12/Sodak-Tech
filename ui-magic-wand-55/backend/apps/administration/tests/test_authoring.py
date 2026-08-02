"""Regression tests for the problem-authoring write path.

Both cases here cover bugs that lost data silently rather than failing. That is
the reason they are tested at all: an authoring endpoint that returns 201 while
discarding what it was given is worse than one that errors, because the problem
only surfaces later as an unsolvable problem or an untagged one.
"""

from __future__ import annotations

import pytest
from django.urls import reverse

from apps.accounts.models import Role, User
from apps.problems.models import Problem, Tag


@pytest.fixture
def setter(db) -> User:
    return User.objects.create_user(
        email="setter@example.com",
        username="setter",
        password="a-sufficiently-long-password",
        role=Role.ADMIN,
        is_staff=True,
    )


@pytest.fixture
def client_as_setter(client, setter):
    client.force_login(setter)
    return client


VERSION_PAYLOAD = {
    "time_limit_ms": 1000,
    "memory_limit_mb": 256,
    "comparison_mode": "exact",
    "publish": True,
    "test_groups": [
        {
            "name": "Samples",
            "weight": 1,
            "is_sample": True,
            "cases": [{"input_data": "1 2", "expected_output": "3"}],
        },
        {
            "name": "Hidden",
            "weight": 3,
            "is_sample": False,
            "cases": [{"input_data": "40 2", "expected_output": "42"}],
        },
    ],
}


def create_problem(client, **overrides):
    payload = {
        "slug": "sum-two",
        "title": "Sum Two",
        "difficulty": "easy",
        "is_public": True,
    }
    payload.update(overrides)
    return client.post(
        reverse("administration:problem-create"),
        data=payload,
        content_type="application/json",
    )


@pytest.mark.django_db
def test_test_case_input_is_persisted(client_as_setter):
    """The view read the input under a key the serializer never produced.

    Every case was stored with empty input, so a correct solution received no
    stdin and failed. Nothing reported an error at upload time.
    """
    assert create_problem(client_as_setter).status_code == 201

    response = client_as_setter.post(
        reverse("administration:version-create", args=["sum-two"]),
        data=VERSION_PAYLOAD,
        content_type="application/json",
    )
    assert response.status_code == 201, response.content

    version = Problem.objects.get(slug="sum-two").current_version
    assert version is not None, "publish=true must set the current version"

    stored = {
        group.name: [(c.input_data, c.expected_output) for c in group.test_cases.all()]
        for group in version.test_groups.all()
    }
    assert stored["Samples"] == [("1 2", "3")]
    assert stored["Hidden"] == [("40 2", "42")]


@pytest.mark.django_db
def test_unknown_test_case_key_is_rejected(client_as_setter):
    """A misspelled key must fail loudly rather than store a blank input."""
    assert create_problem(client_as_setter).status_code == 201

    payload = {
        **VERSION_PAYLOAD,
        "test_groups": [
            {
                "name": "Samples",
                "weight": 1,
                "is_sample": True,
                # 'stdin' is not a field the API accepts.
                "cases": [{"stdin": "1 2", "expected_output": "3"}],
            }
        ],
    }
    response = client_as_setter.post(
        reverse("administration:version-create", args=["sum-two"]),
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 400
    assert b"stdin" in response.content


@pytest.mark.django_db
def test_blank_input_is_still_accepted(client_as_setter):
    """An empty input is a legitimate case and must not be mistaken for a typo."""
    assert create_problem(client_as_setter).status_code == 201

    payload = {
        **VERSION_PAYLOAD,
        "test_groups": [
            {
                "name": "Handles empty input",
                "weight": 1,
                "is_sample": True,
                "cases": [{"input_data": "", "expected_output": "0"}],
            }
        ],
    }
    response = client_as_setter.post(
        reverse("administration:version-create", args=["sum-two"]),
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 201, response.content


@pytest.mark.django_db
def test_tags_are_created_when_missing(client_as_setter):
    """Tags were matched against existing rows only, so on a fresh install
    every slug was dropped and problems were created untagged."""
    assert Tag.objects.count() == 0

    response = create_problem(client_as_setter, tag_slugs=["arrays", "hashing"])
    assert response.status_code == 201, response.content

    problem = Problem.objects.get(slug="sum-two")
    assert sorted(problem.tags.values_list("slug", flat=True)) == ["arrays", "hashing"]
    assert Tag.objects.get(slug="arrays").name == "Arrays"


@pytest.mark.django_db
def test_tags_are_replaced_on_update(client_as_setter):
    assert create_problem(client_as_setter, tag_slugs=["arrays"]).status_code == 201

    response = client_as_setter.patch(
        reverse("administration:problem-detail", args=["sum-two"]),
        data={"tag_slugs": ["graphs"]},
        content_type="application/json",
    )
    assert response.status_code == 200, response.content

    problem = Problem.objects.get(slug="sum-two")
    assert list(problem.tags.values_list("slug", flat=True)) == ["graphs"]


@pytest.mark.django_db
def test_version_requires_a_sample_group(client_as_setter):
    """Run has nothing to execute without one, so this is rejected at upload."""
    assert create_problem(client_as_setter).status_code == 201

    payload = {
        **VERSION_PAYLOAD,
        "test_groups": [
            {
                "name": "Hidden only",
                "weight": 1,
                "is_sample": False,
                "cases": [{"input_data": "1", "expected_output": "1"}],
            }
        ],
    }
    response = client_as_setter.post(
        reverse("administration:version-create", args=["sum-two"]),
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 400
