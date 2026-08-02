"""Problem serializers.

The hard rule here is §8.1: hidden test data never reaches the client. Only
test groups flagged `is_sample` are serialised, and even those expose input and
expected output only because they are already published in the statement.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.problems.models import Problem, Tag, TestCase, TestGroup


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["slug", "name"]


class SampleTestCaseSerializer(serializers.ModelSerializer):
    """Sample cases only. Never instantiate this for a hidden group."""

    class Meta:
        model = TestCase
        fields = ["id", "order", "input_data", "expected_output"]


class ProblemListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    acceptance_rate = serializers.SerializerMethodField()
    progress_state = serializers.SerializerMethodField()

    class Meta:
        model = Problem
        fields = [
            "id", "slug", "title", "difficulty", "tags",
            "acceptance_rate", "solved_count", "attempt_count", "progress_state",
        ]

    def get_acceptance_rate(self, obj: Problem) -> float:
        if not obj.attempt_count:
            return 0.0
        return round(obj.solved_count / obj.attempt_count, 4)

    def get_progress_state(self, obj: Problem) -> str:
        """Read from the prefetched progress map the view builds.

        Deliberately not a per-object query: this serialiser renders a list
        page, and a query here would be the N+1 that §3.3 of the stack doc
        calls "the dominant backend defect in this framework".
        """
        progress_map = self.context.get("progress_map", {})
        return progress_map.get(obj.id, "not_attempted")


class ProblemDetailSerializer(ProblemListSerializer):
    examples = serializers.SerializerMethodField()
    time_limit_ms = serializers.SerializerMethodField()
    memory_limit_mb = serializers.SerializerMethodField()
    problem_version_id = serializers.SerializerMethodField()
    editorial_unlocked = serializers.SerializerMethodField()
    languages = serializers.SerializerMethodField()
    judge_mode = serializers.SerializerMethodField()
    starter_code = serializers.SerializerMethodField()

    class Meta(ProblemListSerializer.Meta):
        fields = [
            *ProblemListSerializer.Meta.fields,
            "statement", "input_format", "output_format", "constraints", "notes",
            "examples", "time_limit_ms", "memory_limit_mb", "problem_version_id",
            "editorial_unlocked", "languages", "judge_mode", "starter_code",
        ]

    def _version(self, obj: Problem):  # noqa: ANN202
        return obj.current_version

    def get_time_limit_ms(self, obj: Problem) -> int:
        v = self._version(obj)
        return v.time_limit_ms if v else 1000

    def get_memory_limit_mb(self, obj: Problem) -> int:
        v = self._version(obj)
        return v.memory_limit_mb if v else 256

    def get_problem_version_id(self, obj: Problem) -> str | None:
        v = self._version(obj)
        return str(v.id) if v else None

    def get_examples(self, obj: Problem) -> list[dict]:
        """Sample groups only — hidden cases are never serialised."""
        version = self._version(obj)
        if version is None:
            return []
        samples = TestGroup.objects.filter(
            problem_version=version, is_sample=True
        ).prefetch_related("test_cases")

        return [
            {
                "input": case.input_data,
                "output": case.expected_output,
                "explanation": group.description,
            }
            for group in samples
            for case in group.test_cases.all()
        ]

    def get_languages(self, obj: Problem) -> list[dict]:
        version = self._version(obj)
        if version is None or not version.language_images:
            return [{"id": "python", "name": "Python", "version": "3.13"}]
        labels = {
            "python": "Python",
            "java": "Java",
            "cpp": "C++",
            "c": "C",
        }
        return [
            {
                "id": lang,
                "name": labels.get(lang, lang.title()),
                "version": image.split(":")[-1][:16],
            }
            for lang, image in version.language_images.items()
        ]

    def get_editorial_unlocked(self, obj: Problem) -> bool:
        """§3.6: decided server-side, on every fetch.

        This flag tells the client whether to offer the editorial tab. It is
        not the gate itself -- the content lives behind its own endpoint that
        re-checks. A client that lies about this flag gains nothing.
        """
        return bool(self.context.get("editorial_unlocked", False))

    def get_judge_mode(self, obj: Problem) -> str:
        v = self._version(obj)
        return v.judge_mode if v else "io"

    def get_starter_code(self, obj: Problem) -> dict[str, str]:
        """Per-language starter for signature problems; empty for io problems.

        The starter is the learner's starting buffer -- the function stub they
        fill in. The driver stays on the server; a learner who never sees it
        cannot adjust their output formatting to game a checker.
        """
        v = self._version(obj)
        if v is None:
            return {}
        return {
            lang: templates["starter"]
            for lang, templates in v.signature_templates.items()
            if isinstance(templates, dict) and "starter" in templates
        }
