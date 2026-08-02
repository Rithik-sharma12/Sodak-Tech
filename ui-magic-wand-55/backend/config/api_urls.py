"""Versioned API surface.

Keeping this separate from urls.py keeps the version prefix in exactly one
place.
"""

from django.urls import include, path

urlpatterns = [
    path("auth/", include("apps.accounts.urls")),
    path("problems/", include("apps.problems.urls")),
    path("submissions/", include("apps.submissions.urls")),
    path("progress/", include("apps.progress.urls")),
    path("contests/", include("apps.contests.urls")),
    path("admin/", include("apps.administration.urls")),
]
