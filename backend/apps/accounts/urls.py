from django.urls import path

app_name = "accounts"

# Endpoints are added as the app grows; the module exists so config/api_urls.py
# can mount it from the start.
urlpatterns: list[path] = []
