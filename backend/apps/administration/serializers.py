"""Admin API serializers.

These expose data that the learner-facing API deliberately withholds — hidden
test cases, user emails, audit entries. Every view using them is gated on
role, and §8.3 requires that reading hidden test data is itself audited.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.accounts.models import Role, User
from apps.audit.models import AuditLog
from apps.contests.models import Contest, ContestProblem
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
            "comparison_mode", "float_tolerance", "judge_mode",
            "signature_templates", "published_at", "is_published",
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

    # Blank or absent on create: the view derives one from the title so the
    # form can promise "blank = derived from title" (§7.3 never collides).
    slug = serializers.SlugField(max_length=64, required=False, allow_blank=True)
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
    judge_mode = serializers.ChoiceField(choices=["io", "signature"], default="io")
    signature_templates = serializers.JSONField(required=False, default=dict)
    change_note = serializers.CharField(required=False, allow_blank=True, default="")
    publish = serializers.BooleanField(default=False)
    test_groups = TestGroupWriteSerializer(many=True)

    def validate(self, attrs: dict) -> dict:
        # A signature-mode version is unusable without per-language harnesses:
        # there is nothing to merge the learner's function into.
        if attrs.get("judge_mode") == "signature" and not attrs.get("signature_templates"):
            raise serializers.ValidationError(
                "signature_templates are required when judge_mode is 'signature'."
            )
        return attrs

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
    # Blank or absent on create: the view derives one from the title.
    slug = serializers.SlugField(max_length=128, required=False, allow_blank=True)
    # §7.3: optimistic concurrency — a conflicting edit is a 409, never a
    # silent overwrite. The write-only counterpart to `expected_row_version`.
    row_version = serializers.IntegerField(read_only=True)
    expected_row_version = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = Contest
        fields = [
            "id", "slug", "title", "description", "state", "scoring_mode",
            "starts_at", "ends_at", "freeze_at", "grace_period_seconds",
            "penalty_minutes_per_wrong", "is_rated", "is_public",
            "rules_text", "tiebreak_rule",
            "owner_username", "problem_count", "registration_count",
            "row_version", "expected_row_version", "created_at",
        ]
        read_only_fields = ["id", "state", "created_at"]

    def validate(self, attrs: dict) -> dict:
        """Timing invariants, using committed values as the baseline on a
        partial update so un-sent fields are not mistaken for edits."""
        instance = self.instance
        starts_at = attrs.get("starts_at", getattr(instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(instance, "ends_at", None))
        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError("ends_at must be after starts_at.")
        freeze_at = attrs.get("freeze_at", getattr(instance, "freeze_at", None))
        if freeze_at:
            if starts_at and freeze_at <= starts_at:
                raise serializers.ValidationError("freeze_at must be after starts_at.")
            if ends_at and freeze_at >= ends_at:
                raise serializers.ValidationError("freeze_at must be before ends_at.")
        return attrs


class AdminContestProblemSerializer(serializers.ModelSerializer):
    """One problem pinned into a contest, with the version it is pinned to."""

    problem_slug = serializers.CharField(source="problem.slug", read_only=True)
    problem_title = serializers.CharField(source="problem.title", read_only=True)
    problem_difficulty = serializers.CharField(source="problem.difficulty", read_only=True)
    version_number = serializers.IntegerField(
        source="problem_version.version_number", read_only=True
    )

    class Meta:
        model = ContestProblem
        fields = [
            "id", "problem_slug", "problem_title", "problem_difficulty",
            "version_number", "label", "order", "points",
        ]


class ContestProblemWriteSerializer(serializers.Serializer):
    problem_slug = serializers.SlugField()
    version_number = serializers.IntegerField(required=False, allow_null=True)
    label = serializers.CharField(max_length=8)
    order = serializers.IntegerField(min_value=0, default=0)
    points = serializers.IntegerField(min_value=1, default=100)


class ContestDetailSerializer(AdminContestSerializer):
    problems = AdminContestProblemSerializer(
        many=True, read_only=True, source="contest_problems"
    )
    allowed_transitions = serializers.SerializerMethodField()
    resume_state = serializers.CharField(read_only=True)

    class Meta(AdminContestSerializer.Meta):
        fields = AdminContestSerializer.Meta.fields + [
            "problems", "allowed_transitions", "resume_state",
        ]

    def get_allowed_transitions(self, obj: Contest) -> list[str]:
        from apps.contests.models import ALLOWED_TRANSITIONS

        return sorted(ALLOWED_TRANSITIONS.get(obj.state, set()))


class ContestTransitionSerializer(serializers.Serializer):
    to_state = serializers.CharField()


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id", "action", "actor_label", "target_type", "target_id",
            "summary", "metadata", "ip_address", "created_at",
        ]
