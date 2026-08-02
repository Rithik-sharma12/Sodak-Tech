"""Contests and their lifecycle.

SODAK-TECH-DESIGN.md §3.7:

    Draft -> Published -> Running -> Frozen -> Ended -> Provisional -> Final

    Plus an out-of-band Paused state, enterable from Running or Frozen by an
    admin, which stops the clock and blocks submissions. Without it, the only
    options during a bad-test-case incident are to continue with a broken
    problem or cancel.

And: "Lifecycle transitions are explicit operations, never direct field edits.
Each writes an audit entry." §7.3 lists "Contest state edited directly" as
blocked. `transition_to` below is the only supported path, and it validates
against the adjacency map rather than trusting the caller.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.models import (
    SoftDeleteModel,
    TimestampedModel,
    UUIDPrimaryKeyModel,
    VersionedModel,
)


class ContestState(models.TextChoices):
    DRAFT = "draft", _("Draft")
    PUBLISHED = "published", _("Published")
    RUNNING = "running", _("Running")
    FROZEN = "frozen", _("Frozen")
    PAUSED = "paused", _("Paused")
    ENDED = "ended", _("Ended")
    PROVISIONAL = "provisional", _("Provisional")
    FINAL = "final", _("Final")


# Explicit adjacency. A transition absent from this map is impossible, which is
# what makes "never direct field edits" enforceable rather than aspirational.
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    ContestState.DRAFT: {ContestState.PUBLISHED},
    ContestState.PUBLISHED: {ContestState.RUNNING, ContestState.DRAFT},
    ContestState.RUNNING: {ContestState.FROZEN, ContestState.PAUSED, ContestState.ENDED},
    ContestState.FROZEN: {ContestState.PAUSED, ContestState.ENDED},
    # Paused returns to whichever state it came from; `resume_state` records it.
    ContestState.PAUSED: {ContestState.RUNNING, ContestState.FROZEN, ContestState.ENDED},
    ContestState.ENDED: {ContestState.PROVISIONAL},
    ContestState.PROVISIONAL: {ContestState.FINAL},
    # Terminal. Rejudging after this point needs an explicit override and its
    # own audit entry (§7.2), not a transition back.
    ContestState.FINAL: set(),
}


class ScoringMode(models.TextChoices):
    PARTIAL = "partial", _("Partial (sum of best scores)")
    ICPC = "icpc", _("ICPC (solved count, then penalty)")


class InvalidTransition(Exception):
    """Raised when a lifecycle transition is not in ALLOWED_TRANSITIONS."""


class Contest(UUIDPrimaryKeyModel, TimestampedModel, SoftDeleteModel, VersionedModel):
    slug = models.SlugField(max_length=128, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    state = models.CharField(
        max_length=16, choices=ContestState.choices, default=ContestState.DRAFT, db_index=True
    )
    # Set when entering PAUSED so resuming returns to the right state rather
    # than guessing.
    resume_state = models.CharField(max_length=16, blank=True)

    scoring_mode = models.CharField(
        max_length=16, choices=ScoringMode.choices, default=ScoringMode.PARTIAL
    )

    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField(db_index=True)
    # §3.7: the public leaderboard stops updating from here.
    freeze_at = models.DateTimeField(null=True, blank=True)

    # Accumulated pause duration, added to the deadline. Kept separate from
    # ends_at so the originally published end time stays visible.
    paused_duration_seconds = models.PositiveIntegerField(default=0)
    paused_at = models.DateTimeField(null=True, blank=True)

    # §7.2: "Submission arriving at the buzzer -- grace window published in
    # advance or explicitly zero." Explicit, either way.
    grace_period_seconds = models.PositiveIntegerField(default=0)

    # ICPC mode only.
    penalty_minutes_per_wrong = models.PositiveIntegerField(default=20)

    is_rated = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False, db_index=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="owned_contests"
    )

    # §9: "Published rules before every contest [...] Most contest disputes are
    # rule ambiguity rather than defects."
    rules_text = models.TextField(blank=True)
    tiebreak_rule = models.TextField(blank=True)

    class Meta:
        db_table = "contests"
        ordering = ["-starts_at"]
        indexes = [
            models.Index(fields=["state", "starts_at"]),
            models.Index(fields=["is_public", "-starts_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.slug} [{self.state}]"

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def can_transition_to(self, new_state: str) -> bool:
        return new_state in ALLOWED_TRANSITIONS.get(self.state, set())

    def transition_to(self, new_state: str, *, actor=None) -> None:  # noqa: ANN001
        """The only supported way to change contest state.

        Callers wrap this in `audited(...)` so the state change and its audit
        entry share a transaction (§9).
        """
        if not self.can_transition_to(new_state):
            raise InvalidTransition(
                f"Cannot move contest {self.slug} from {self.state} to {new_state}."
            )

        now = timezone.now()

        if new_state == ContestState.PAUSED:
            self.resume_state = self.state
            self.paused_at = now
        elif self.state == ContestState.PAUSED and self.paused_at:
            # Stopping the clock means the pause does not consume contest time.
            self.paused_duration_seconds += int((now - self.paused_at).total_seconds())
            self.paused_at = None
            self.resume_state = ""

        self.state = new_state
        self.save(
            update_fields=[
                "state", "resume_state", "paused_at",
                "paused_duration_seconds", "updated_at",
            ]
        )

    # ------------------------------------------------------------------
    # Timing
    # ------------------------------------------------------------------

    @property
    def effective_ends_at(self):  # noqa: ANN201
        """End time extended by however long the contest was paused."""
        return self.ends_at + timezone.timedelta(seconds=self.paused_duration_seconds)

    @property
    def submission_deadline(self):  # noqa: ANN201
        return self.effective_ends_at + timezone.timedelta(seconds=self.grace_period_seconds)

    def accepts_submissions(self, at=None) -> bool:  # noqa: ANN001
        """§7.2: cutoff is on server receive time, never a client clock."""
        at = at or timezone.now()
        if self.state not in {ContestState.RUNNING, ContestState.FROZEN}:
            return False
        return self.starts_at <= at <= self.submission_deadline

    def leaderboard_is_frozen(self, at=None) -> bool:  # noqa: ANN001
        """Freeze is enforced here, server-side.

        §10 lists "Freeze verified to be enforced server-side, not in the
        client" as a launch blocker for contests.
        """
        if self.state == ContestState.FROZEN:
            return True
        if self.freeze_at is None:
            return False
        at = at or timezone.now()
        return at >= self.freeze_at and self.state in {
            ContestState.RUNNING, ContestState.PAUSED
        }

    @property
    def problems_are_readable(self) -> bool:
        """§8.5: contest problems are unreadable until the start time.

        Checked on every fetch. They are "not preloaded to the client, not
        served from guessable paths, and not cached at a public edge."
        """
        if self.state in {ContestState.DRAFT, ContestState.PUBLISHED}:
            return False
        return timezone.now() >= self.starts_at


class ContestProblem(UUIDPrimaryKeyModel, TimestampedModel):
    """A problem placed in a contest, pinned to one version.

    Pinning here as well as on the submission means a mid-contest version bump
    cannot change what participants are solving.
    """

    contest = models.ForeignKey(
        Contest, on_delete=models.CASCADE, related_name="contest_problems"
    )
    problem = models.ForeignKey(
        "problems.Problem", on_delete=models.PROTECT, related_name="contest_appearances"
    )
    problem_version = models.ForeignKey(
        "problems.ProblemVersion", on_delete=models.PROTECT, related_name="+"
    )

    # The contest-local label, e.g. "A", "B".
    label = models.CharField(max_length=8)
    order = models.PositiveIntegerField(default=0)
    points = models.PositiveIntegerField(default=100)

    class Meta:
        db_table = "contest_problems"
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(
                fields=["contest", "problem"], name="uniq_contest_problem"
            ),
            models.UniqueConstraint(
                fields=["contest", "label"], name="uniq_contest_problem_label"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.contest.slug} {self.label}"


class ParticipationStatus(models.TextChoices):
    REGISTERED = "registered", _("Registered")
    PARTICIPATED = "participated", _("Participated")
    # §7.2: setters and admins are "forced to unofficial status; visible to
    # them, absent from standings".
    UNOFFICIAL = "unofficial", _("Unofficial")
    VIRTUAL = "virtual", _("Virtual")
    DISQUALIFIED = "disqualified", _("Disqualified")


class Registration(UUIDPrimaryKeyModel, TimestampedModel):
    contest = models.ForeignKey(
        Contest, on_delete=models.CASCADE, related_name="registrations"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="registrations"
    )

    status = models.CharField(
        max_length=16,
        choices=ParticipationStatus.choices,
        default=ParticipationStatus.REGISTERED,
        db_index=True,
    )

    # Virtual participation runs on a personal timer and never merges with
    # official results (§7.2).
    virtual_started_at = models.DateTimeField(null=True, blank=True)

    rating_before = models.IntegerField(null=True, blank=True)
    rating_after = models.IntegerField(null=True, blank=True)

    disqualified_reason = models.TextField(blank=True)

    class Meta:
        db_table = "contest_registrations"
        constraints = [
            models.UniqueConstraint(
                fields=["contest", "user"], name="uniq_contest_registration"
            )
        ]
        indexes = [models.Index(fields=["contest", "status"])]

    def __str__(self) -> str:
        return f"{self.user} @ {self.contest.slug} [{self.status}]"

    @property
    def counts_in_standings(self) -> bool:
        """§7.2: registered-but-never-participated is excluded entirely."""
        return self.status == ParticipationStatus.PARTICIPATED
