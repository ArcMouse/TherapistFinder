from django.urls import path

from .portal_views import (
    TherapistAvailabilityDetailView,
    TherapistAvailabilityView,
    TherapistMeView,
    TherapistSessionListView,
)
from .views import (
    SearchView,
    TherapistAvailabilityView as PublicAvailabilityView,
    TherapistDetailView,
    TherapistListView,
)

urlpatterns = [
    # Public / client-facing
    path("therapists/", TherapistListView.as_view(), name="therapist-list"),
    path("therapists/<int:pk>/", TherapistDetailView.as_view(), name="therapist-detail"),
    path(
        "therapists/<int:pk>/availability/",
        PublicAvailabilityView.as_view(),
        name="therapist-availability",
    ),
    path("search/", SearchView.as_view(), name="search"),
    # Therapist portal (therapist accounts only)
    path("therapist/me/", TherapistMeView.as_view(), name="portal-me"),
    path("therapist/sessions/", TherapistSessionListView.as_view(), name="portal-sessions"),
    path(
        "therapist/availability/",
        TherapistAvailabilityView.as_view(),
        name="portal-availability",
    ),
    path(
        "therapist/availability/<int:pk>/",
        TherapistAvailabilityDetailView.as_view(),
        name="portal-availability-detail",
    ),
]