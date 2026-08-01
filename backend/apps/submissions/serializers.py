"""Submission serializers.

§8.5 constrains what may be returned during a contest: "Feedback during contests
is limited to the verdict and at most a failing test index -- never input, never
a diff. Detailed diagnostics remain a practice-mode feature."

`SubmissionResultSerializer` therefore drops `case_results` whenever the
submission belongs to a contest, rather than relying on the view to remember.
"""

from __future__ import annotations

import hashlib

from django.conf import settings
from rest_framework import serializers

from apps.problems.models import Problem
from apps.submissions.models import Submission, SubmissionKind, SubmissionResult


class SubmissionResultSerializer(serializers.ModelSerializer):
    test_group_name = serializers.CharField(source="test_group.name", read_only=True)
    case_results = serializers.SerializerMethodField()

    class Meta:
        model = SubmissionResult
        fields = [
            "test_group_name", "verdict", "passed", "cases_total", "cases_passed",
            "weight", "max_runtime_ms", "max_memory_kb",
            "first_failing_case_index", "case_results",
        ]

    def get_case_results(self, obj: SubmissionResult) -> list:
        """Withheld for contest submissions -- see §8.5."""
        if obj.submission.contest_id is not None:
            return []
        return obj.case_results


class SubmissionSerializer(serializers.ModelSerializer):
    problem_slug = serializers.CharField(source="problem.slug", read_only=True)
    problem_title = serializers.CharField(source="problem.title", read_only=True)
    results = SubmissionResultSerializer(many=True, read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id", "problem_slug", "problem_title", "language", "verdict",
            "score", "max_runtime_ms", "max_memory_kb", "received_at",
            "judged_at", "kind", "compile_output", "results",
        ]


class SubmissionCreateSerializer(serializers.Serializer):
    """Validates a submission before it costs a judge worker.

    §7.1 requires empty submissions to be "rejected at the API before consuming
    a worker", and §4.1 requires the size cap. Both are enforced here rather
    than in the view so that every entry point gets them.
    """

    problem_slug = serializers.SlugField()
    language = serializers.CharField(max_length=32)
    source_code = serializers.CharField()
    kind = serializers.ChoiceField(
        choices=SubmissionKind.choices, default=SubmissionKind.SUBMIT
    )
    # §7.1: "Duplicate submission from a double click -- client-supplied
    # idempotency key; repeat returns the existing submission."
    idempotency_key = serializers.CharField(max_length=64, required=False, allow_blank=True)

    def validate_source_code(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError(
                "Submission is empty. Write some code before submitting."
            )
        encoded = value.encode("utf-8")
        if len(encoded) > settings.MAX_SUBMISSION_BYTES:
            raise serializers.ValidationError(
                f"Submission exceeds the {settings.MAX_SUBMISSION_BYTES} byte limit."
            )
        return value

    def validate_problem_slug(self, value: str) -> str:
        problem = Problem.objects.filter(slug=value, is_public=True).first()
        if problem is None:
            raise serializers.ValidationError("No such problem.")
        if problem.current_version_id is None:
            raise serializers.ValidationError(
                "This problem has no published version and cannot accept submissions."
            )
        self.context["problem"] = problem
        return value

    def validate(self, attrs: dict) -> dict:
        # Derive a key when the client does not send one. Hashing the payload
        # means an accidental double-POST of identical code collapses, while a
        # genuine resubmission of changed code does not.
        if not attrs.get("idempotency_key"):
            user = self.context["request"].user
            digest = hashlib.sha256(
                f"{user.pk}:{attrs['problem_slug']}:{attrs['language']}:"
                f"{attrs['kind']}:{attrs['source_code']}".encode()
            ).hexdigest()
            attrs["idempotency_key"] = digest[:64]
        return attrs
