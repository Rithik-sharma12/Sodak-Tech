"""Problems, immutable versions, and weighted test groups.

Design principle 5: "Content is versioned data. Problems, test sets, and
rubrics carry versions. Every submission pins the version it was judged
against."

That pinning is what makes principle 6 possible -- "Rejudge is a first-class
operation, not an emergency script. A wrong test case will ship." Without an
immutable version to point at, a rejudge cannot say what it is rejudging
against, and a score cannot be recomputed after the fact.
"""

from __future__ import annotations

from typing import Any

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import (
    SoftDeleteModel,
    TimestampedModel,
    UUIDPrimaryKeyModel,
    VersionedModel,
)


class Difficulty(models.TextChoices):
    EASY = "easy", _("Easy")
    MEDIUM = "medium", _("Medium")
    HARD = "hard", _("Hard")


class JudgingMode(models.TextChoices):
    """How a learner's code is run against test cases.

    `io` is the classic OJ contract: the submission is a complete program that
    reads stdin and writes stdout.

    `signature` is the LeetCode-style contract (§ design note): the submission
    is just the solution function, and the version's `signature_templates`
    carry per-language driver code that parses the same test-case input, calls
    the learner's function, and prints the result. The driver is setter-authored
    and versioned like everything else the judge depends on.
    """

    IO = "io", _("I/O (stdin/stdout)")
    SIGNATURE = "signature", _("Function signature")


class Tag(TimestampedModel):
    """Topic tag. Drives the per-tag skill breakdown in §3 of the design doc."""

    slug = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=64)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "tags"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Problem(UUIDPrimaryKeyModel, TimestampedModel, SoftDeleteModel, VersionedModel):
    """A problem's stable identity and its mutable presentation.

    Everything that affects judging lives on ProblemVersion instead. This split
    is deliberate: fixing a typo in a statement must not invalidate existing
    submissions, but changing a time limit must.
    """

    slug = models.SlugField(max_length=128, unique=True, db_index=True)
    title = models.CharField(max_length=200)

    # Setter-authored content is still user input and is sanitised on the way
    # out (§8.2: "Problem statements sanitized").
    statement = models.TextField(blank=True)
    input_format = models.TextField(blank=True)
    output_format = models.TextField(blank=True)
    constraints = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    difficulty = models.CharField(
        max_length=16, choices=Difficulty.choices, default=Difficulty.EASY, db_index=True
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="problems")

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="authored_problems",
    )

    # The version served to new submissions. Null until a version is published,
    # which is what keeps an unfinished problem unsubmittable.
    current_version = models.ForeignKey(
        "problems.ProblemVersion",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="+",
    )

    is_public = models.BooleanField(default=False, db_index=True)

    # Materialised aggregates. §3.3 of the stack doc: computed on a schedule,
    # never per request.
    solved_count = models.PositiveIntegerField(default=0)
    attempt_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "problems"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_public", "difficulty"]),
            models.Index(fields=["author", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.slug} — {self.title}"

    @property
    def is_submittable(self) -> bool:
        return self.is_public and self.current_version_id is not None


class ProblemVersion(UUIDPrimaryKeyModel, TimestampedModel):
    """An immutable snapshot of everything judging depends on.

    Once `published_at` is set, nothing on this row or its test data may change.
    §7.3 requires that replacing test data is blocked and "replacement creates a
    new version". `save()` enforces that here; the API layer surfaces it as a
    validation error rather than a 500.
    """

    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="versions"
    )
    version_number = models.PositiveIntegerField()

    # Resource limits. Pinned per version so a limit change is a new version
    # and old verdicts stay explicable (§7.1, "Compiler or runtime version
    # drift").
    time_limit_ms = models.PositiveIntegerField(
        default=1000, validators=[MinValueValidator(100)]
    )
    memory_limit_mb = models.PositiveIntegerField(
        default=256, validators=[MinValueValidator(16)]
    )
    output_limit_kb = models.PositiveIntegerField(default=8192)

    # §7.1: floating-point answers use tolerance-based comparison, with the
    # tolerance declared in the statement.
    comparison_mode = models.CharField(
        max_length=16,
        choices=[
            ("exact", "Exact after whitespace normalisation"),
            ("float", "Floating point within tolerance"),
            ("checker", "Custom checker"),
        ],
        default="exact",
    )
    float_tolerance = models.FloatField(null=True, blank=True)

    # §8.4: authoring this is restricted to Admin and above. A setter who can
    # write a checker is effectively root on the judge fleet.
    checker_source = models.TextField(blank=True)
    checker_language = models.CharField(max_length=32, blank=True)

    # Language runtimes pinned by digest, displayed to users (§5.2 of the stack
    # doc). Shape: {"python": "python:3.13-slim@sha256:...", ...}
    language_images = models.JSONField(default=dict, blank=True)

    # How submissions are executed against the test set.
    judge_mode = models.CharField(
        max_length=16,
        choices=JudgingMode.choices,
        default=JudgingMode.IO,
        db_index=True,
    )

    # Per-language (starter, driver) pairs for signature-mode problems. The
    # driver is the setter-authored harness: it parses `input_data`, calls the
    # learner's function and prints the result. `%%USER_CODE%%` marks where the
    # submitted source is injected. Part of the version, so a signature change
    # is a new version like any other judging-relevant change.
    # Shape: {"python": {"starter": "...", "driver": "..."}, ...}
    signature_templates = models.JSONField(default=dict, blank=True)

    # The rubric this version is scored against. Stored so that a score can be
    # recomputed later -- principle 4: "A stored final score that cannot be
    # recomputed is unrecoverable when the rubric is wrong."
    rubric = models.JSONField(default=dict, blank=True)

    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )
    change_note = models.TextField(blank=True)

    class Meta:
        db_table = "problem_versions"
        ordering = ["-version_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["problem", "version_number"], name="uniq_problem_version_number"
            )
        ]

    def __str__(self) -> str:
        return f"{self.problem.slug} v{self.version_number}"

    @property
    def is_published(self) -> bool:
        return self.published_at is not None

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.pk and not self._state.adding:
            original = ProblemVersion.objects.filter(pk=self.pk).values("published_at").first()
            if original and original["published_at"] is not None:
                # Allow only the no-op re-save of an already-published row.
                raise PermissionError(
                    f"{self} is published and immutable. Create a new version instead."
                )
        super().save(*args, **kwargs)

    def total_weight(self) -> int:
        return sum(g.weight for g in self.test_groups.all())


class TestGroup(UUIDPrimaryKeyModel, TimestampedModel):
    """A weighted, named group of test cases.

    §3.5: "Partial credit is awarded per test group, not per individual test --
    group weights encode meaning ('handles empty input') rather than an
    arbitrary fraction."

    A group scores only if every case in it passes. That is what makes the name
    meaningful: "handles empty input" is either true or it is not.
    """

    problem_version = models.ForeignKey(
        ProblemVersion, on_delete=models.CASCADE, related_name="test_groups"
    )
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)

    weight = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    # Sample groups are shown to the user and run by "Run"; hidden groups run
    # only on "Submit" and their contents never reach the client (§8.1).
    is_sample = models.BooleanField(default=False, db_index=True)

    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "test_groups"
        ordering = ["order", "created_at"]
        indexes = [models.Index(fields=["problem_version", "is_sample"])]

    def __str__(self) -> str:
        kind = "sample" if self.is_sample else "hidden"
        return f"{self.name} ({kind}, weight {self.weight})"


class TestCase(UUIDPrimaryKeyModel, TimestampedModel):
    """One input/expected-output pair.

    §8.1 constrains how this data may be handled: "The full test set is never
    placed inside the sandbox; cases are supplied one at a time, expected output
    never leaves the application core."

    So `expected_output` is read by the API when comparing a result, and is
    never included in a job payload sent to a worker. The worker returns actual
    output (capped) and the core decides.
    """

    test_group = models.ForeignKey(
        TestGroup, on_delete=models.CASCADE, related_name="test_cases"
    )
    order = models.PositiveIntegerField(default=0)

    # Large payloads live in object storage; these hold the reference and a
    # digest. §7.1 requires streaming for oversized inputs rather than loading
    # them whole.
    input_key = models.CharField(max_length=512, blank=True)
    expected_output_key = models.CharField(max_length=512, blank=True)

    # Inline storage for small cases, which is most of them.
    input_data = models.TextField(blank=True)
    expected_output = models.TextField(blank=True)

    input_sha256 = models.CharField(max_length=64, blank=True)
    expected_output_sha256 = models.CharField(max_length=64, blank=True)

    size_bytes = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "test_cases"
        ordering = ["order", "created_at"]
        indexes = [models.Index(fields=["test_group", "order"])]

    def __str__(self) -> str:
        return f"{self.test_group.name} #{self.order}"
