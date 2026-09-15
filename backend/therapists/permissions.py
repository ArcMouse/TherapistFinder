from rest_framework.permissions import BasePermission


class IsTherapistUser(BasePermission):
    """Allows access only to authenticated users that have a Therapist profile."""

    message = "This account is not registered as a therapist."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(
            user and user.is_authenticated and hasattr(user, "therapist")
        )