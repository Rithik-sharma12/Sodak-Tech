"""Admin API routes.

Note what is absent and deliberately so: there is no endpoint to write or
delete an audit entry (§8.3), and no endpoint to edit a published problem
version or a contest's state field directly (§7.3). Those are not oversights.
"""

from django.urls import path

from apps.administration import views

app_name = "administration"

urlpatterns = [
    path("dashboard/", views.dashboard, name="dashboard"),
    path("health/", views.system_health, name="health"),

    path("users/", views.AdminUserListView.as_view(), name="user-list"),
    path("users/<uuid:user_id>/role/", views.change_user_role, name="user-role"),
    path("users/<uuid:user_id>/active/", views.set_user_active, name="user-active"),

    path("problems/", views.AdminProblemListView.as_view(), name="problem-list"),
    path("problems/create/", views.create_problem, name="problem-create"),
    path("problems/<slug:slug>/", views.admin_problem_detail, name="problem-detail"),
    path("problems/<slug:slug>/versions/", views.create_version, name="version-create"),
    path(
        "problems/<slug:slug>/versions/<int:version_number>/publish/",
        views.publish_version,
        name="version-publish",
    ),

    path("tags/", views.admin_tags, name="tags"),
    path("tags/<slug:slug>/", views.delete_tag, name="tag-delete"),

    path("contests/", views.AdminContestListView.as_view(), name="contest-list"),
    path("contests/create/", views.create_contest, name="contest-create"),
    path("contests/<slug:slug>/transition/", views.transition_contest, name="contest-transition"),

    path("audit/", views.AuditLogListView.as_view(), name="audit-list"),
]
