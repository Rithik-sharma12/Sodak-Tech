"""Root URL configuration.

Health endpoints are deliberately separate and deliberately different:
liveness answers "is this process wedged?" and readiness answers "should
traffic route here?". SODAK-TECH-STACK.md §4.4 is explicit that conflating
them causes outages -- a liveness probe that checks the database restarts
every replica when the database blips.
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.common.health import liveness, readiness

urlpatterns = [
    path("healthz/live", liveness, name="liveness"),
    path("healthz/ready", readiness, name="readiness"),
    path("admin/", admin.site.urls),
    path("api/v1/", include("config.api_urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
