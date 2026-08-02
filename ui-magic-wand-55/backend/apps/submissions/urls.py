from django.urls import path

from apps.submissions import views

app_name = "submissions"

urlpatterns = [
    path("", views.SubmissionListView.as_view(), name="list"),
    path("create/", views.create_submission, name="create"),
    path("<uuid:pk>/", views.SubmissionDetailView.as_view(), name="detail"),
    path("<uuid:pk>/status/", views.submission_status, name="status"),
]
