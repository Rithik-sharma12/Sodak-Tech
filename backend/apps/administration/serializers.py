"""Admin API serializers.

These expose data that the learner-facing API deliberately withholds — hidden
test cases, user emails, audit entries. Every view using them is gated on
role, and §8.3 requires that reading hidden test data is itself audited.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.accounts.models import Role, User
from apps.audit.models import AuditLog
from apps.contests.models import Contest
from apps.problems.models import Problem, ProblemVersion, Tag, TestCase, TestGroup


class AdminUserSerializer(serializers.ModelSerializer):
    solved_count = serializers.IntegerField(read_only=True, default=0)
    submission_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "display_name", "role", "rating",
            "is_active", "created_at", "last_login_at",
            "solved_count", "submission_count",
        ]
        read_only_fields = ["id", "created_at", "last_login_at"]


class RoleChangeSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=Role.choices)


class AdminTagSerializer(serializers.ModelSerializer):
    problem_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Tag
        fields = ["id", "slug", "name", "description", "problem_count"]


class AdminTestCaseSerializer(serializers.ModelSerializer):
    """Full test case, including expected output.

    Only ever reachable through an admin endpoint that writes a TEST_DATA_READ
    audit entry first (§8.3: "Every hidden test data read is itself an audited
    event").
    """

    class Meta:
        model = TestCase
        fields = ["id", "order", "input_data", "expected_output"]


class AdminTestGroupSerializer(serializers.ModelSerializer):
    test_cases = AdminTestCaseSerializer(many=True, required=False)

    class Meta:
        model = TestGroup
        fields = ["id", "name", "description", "weight", "is_sample", "order", "test_cases"]


class AdminProblemVersionSerializer(serializers.ModelSerializer):
    test_groups = AdminTestGroupSerializer(many=True, read_only=True)
    is_published = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProblemVersion
        fields = [
            "id", "version_number", "time_limit_ms", "memory_limit_mb",
            "comparison_mode", "float_tolerance", "published_at", "is_published",
            "change_note", "created_at", "test_groups",
        ]


class AdminProblemListSerializer(serializers.ModelSerializer):
    tags = AdminTagSerializer(many=True, read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)
    version_count = serializers.IntegerField(read_only=True, default=0)
    is_submittable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Problem
        fields = [
            "id", "slug", "title", "difficulty", "is_public", "is_submittable",
            "tags", "author_username", "solved_count", "attempt_count",
            "version_count", "created_at", "updated_at",
        ]


class AdminProblemDetailSerializer(AdminProblemListSerializer):
    versions = AdminProblemVersionSerializer(many=True, read_only=True)

    class Meta(AdminProblemListSerializer.Meta):
        fields = AdminProblemListSerializer.Meta.fields + [
            "statement", "input_format", "output_format", "constraints", "notes",
            "row_version", "versions",
        ]


class ProblemWriteSerializer(serializers.ModelSerializer):
    """Create/update a problem's presentation.

    Nothing here affects judging — limits and test data live on
    ProblemVersion, which is immutable once published (principle 5). Editing a
    statement typo must not invalidate existing submissions, and this split is
    what guarantees it.
    """

    tag_slugs = serializers.ListField(
        child=serializers.SlugField(), required=False, write_only=True
    )
    # Optimistic concurrency (§7.3: never a silent overwrite).
    expected_row_version = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = Problem
        fields = [
            "slug", "title", "statement", "input_format", "output_format",
            "constraints", "notes", "difficulty", "is_public",
            "tag_slugs", "expected_row_version",
        ]


class TestGroupWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=128)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    weight = serializers.IntegerField(min_value=1, default=1)
    is_sample = serializers.BooleanField(default=False)
    cases = serializers.ListField(child=serializers.DictField(), default=list)


class VersionWriteSerializer(serializers.Serializer):
    """Create a new problem version with its full test set.

    Test data can only ever arrive this way. §7.3 blocks replacing test data on
    an existing version: "Test data replaced without a version bump — Blocked;
    replacement creates a new version."
    """

    time_limit_ms = serializers.IntegerField(min_value=100, default=1000)
    memory_limit_mb = serializers.IntegerField(min_value=16, default=256)
    comparison_mode = serializers.ChoiceField(
        choices=["exact", "float", "checker"], default="exact"
    )
    float_tolerance = serializers.FloatField(required=False, allow_null=True)
    change_note = serializers.CharField(required=False, allow_blank=True, default="")
    publish = serializers.BooleanField(default=False)
    test_groups = TestGroupWriteSerializer(many=True)

    def validate_test_groups(self, value):
        if not value:
            raise serializers.ValidationError("A version needs at least one test group.")
        if not any(g.get("is_sample") for g in value):
            raise serializers.ValidationError(
                "At least one sample group is required — Run has nothing to execute without it."
            )
        for group in value:
            if not group.get("cases"):
                raise serializers.ValidationError(
                    f"Test group '{group.get('name')}' has no cases."
                )
        return value


class AdminContestSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    problem_count = serializers.IntegerField(read_only=True, default=0)
    registration_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Contest
        fields = [
            "id", "slug", "title", "description", "state", "scoring_mode",
            "starts_at", "ends_at", "freeze_at", "is_rated", "is_public",
            "owner_username", "problem_count", "registration_count", "created_at",
        ]
        read_only_fields = ["id", "state", "created_at"]


class ContestTransitionSerializer(serializers.Serializer):
    to_state = serializers.CharField()


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id", "action", "actor_label", "target_type", "target_id",
            "summary", "metadata", "ip_address", "created_at",
        ]
