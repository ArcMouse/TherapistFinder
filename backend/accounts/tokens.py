"""Token helpers shared by the auth views."""

from rest_framework_simplejwt.tokens import RefreshToken


def issue_tokens(user) -> dict:
    """Return a fresh ``{access, refresh}`` JWT pair for ``user``."""
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}