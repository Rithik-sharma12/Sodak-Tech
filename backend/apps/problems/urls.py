from django.urls import path

from apps.problems import views

app_name = "problems"

urlpatterns = [
    path("", views.ProblemListView.as_view(), name="list"),
    path("tags/", views.tags, name="tags"),
    path("<slug:slug>/", views.ProblemDetailView.as_view(), name="detail"),
    # Its own endpoint with its own authorization -- design doc 3.6.
    path("<slug:slug>/editorial/", views.editorial, name="editorial"),
]
