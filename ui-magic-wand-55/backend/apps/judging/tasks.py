"""Celery tasks for judging.

§4.5: a worker terminated mid-judge must release its job rather than leave a
submission pending forever. `acks_late` plus `reject_on_worker_lost` (set in
settings) gives redelivery; the idempotency below makes redelivery safe.

§3.5 / §4.1: practice and contest traffic use separate queues so neither can
delay the other. The routing decision is made here, at enqueue time, because it
depends on whether the submission belongs to a running contest.
"""

from __future__ import annotations

import logging

from celery import shared_task

from apps.submissions.models import Submission, Verdict

logger = logging.getLogger("sodak.judge")

PRACTICE_QUEUE = "judge.practice"
CONTEST_QUEUE = "judge.contest"


@shared_task(
    bind=True,
    name="judging.judge_submission",
    max_retries=2,
    # Retry only what is worth retrying. A wrong answer is not an error; an
    # unreachable sandbox is. §4.2: backoff with jitter, because naive immediate
    # retry amplifies an outage rather than absorbing it.
    autoretry_for=(),
    retry_backoff=True,
    retry_jitter=True,
)
def judge_submission(self, submission_id: str) -> str:
    """Judge one submission. Safe to deliver more than once.

    At-least-once delivery means this can run twice for the same submission,
    typically when a worker dies after judging but before acknowledging. The
    terminal-verdict check below makes the second run a no-op rather than a
    double-counted attempt.
    """
    from apps.judging.pipeline import judge
    from apps.judging.sandbox import SandboxUnavailable

    submission = Submission.objects.filter(pk=submission_id).first()
    if submission is None:
        # The submission was hard-deleted between enqueue and delivery. Nothing
        # to do, and retrying will not bring it back.
        logger.warning("Submission %s no longer exists; dropping job.", submission_id)
        return "missing"

    if submission.is_terminal:
        logger.info("Submission %s already judged (%s); skipping redelivery.",
                    submission_id, submission.verdict)
        return submission.verdict

    try:
        judge(submission)
    except SandboxUnavailable as exc:
        logger.error("Sandbox unavailable for %s: %s", submission_id, exc)
        # Put it back rather than reporting a verdict the submission did not
        # earn. §4.11: an acknowledged submission is a promise.
        Submission.objects.filter(pk=submission_id).update(verdict=Verdict.QUEUED)
        raise self.retry(exc=exc, countdown=10) from exc

    submission.refresh_from_db()
    return submission.verdict


def enqueue(submission: Submission) -> None:
    """Route a submission to the right lane and hand it to the broker."""
    queue = CONTEST_QUEUE if submission.contest_id else PRACTICE_QUEUE
    judge_submission.apply_async(args=[str(submission.id)], queue=queue)


__all__ = ["CONTEST_QUEUE", "PRACTICE_QUEUE", "enqueue", "judge_submission"]
