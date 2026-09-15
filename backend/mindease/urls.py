"""Root URL configuration for the MindEase API."""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from accounts.views import MeView


def health(_request):
    return JsonResponse({"status": "ok", "service": "mindease-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/me/", MeView.as_view(), name="me"),
    path("api/", include("therapists.urls")),
    path("api/", include("bookings.urls")),
]