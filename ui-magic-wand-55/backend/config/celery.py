"""Celery application.

Queue lanes are separated here rather than at the call site so that a task can
never accidentally land in the contest lane. SODAK-TECH-DESIGN.md §4 makes the
priority lane a hard dependency of Phase 2: "Phase 2 requires the priority queue
lane in place before the first real contest."
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("sodak")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self) -> str:
    return f"request: {self.request!r}"
