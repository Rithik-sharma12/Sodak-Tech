from django.urls import path

from apps.accounts import views

app_name = "accounts"

urlpatterns = [
    path("csrf/", views.csrf, name="csrf"),
    path("login/", views.login_view, name="login"),
    path("reauth/", views.reauth_view, name="reauth"),
    path("change-password/", views.change_password_view, name="change-password"),
    path("delete-account/", views.delete_account_view, name="delete-account"),
    path("logout/", views.logout_view, name="logout"),
    path("me/", views.me, name="me"),
]
