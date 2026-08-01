from django.urls import path

from apps.progress import views

app_name = "progress"

urlpatterns = [
    path("me/", views.my_progress, name="me"),
    path("leaderboard/", views.leaderboard, name="leaderboard"),
]
