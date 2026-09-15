"""Authentication views: email/password plus Google ID-token sign-in."""

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile
from .serializers import (
    GoogleAuthSerializer,
    LoginSerializer,
    LogoutSerializer,
    MeSerializer,
    PasswordResetSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
)
from .tokens import issue_tokens

logger = logging.getLogger(__name__)
User = get_user_model()


def _me_payload(user) -> dict:
    return MeSerializer(user).data


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = issue_tokens(user)
        return Response(
            {**tokens, "user": _me_payload(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response({**issue_tokens(user), "user": _me_payload(user)})


class GoogleAuthView(APIView):
    """Verify a Google ID token from the mobile client and issue a JWT pair."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        raw_token = serializer.validated_data["id_token"]

        try:
            claims = id_token.verify_oauth2_token(
                raw_token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError as exc:
            logger.info("Google token verification failed: %s", exc)
            return Response(
                {"detail": "Invalid Google ID token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception as exc:  # pragma: no cover - network/unexpected errors
            logger.warning("Google verification error: %s", exc)
            return Response(
                {"detail": "Could not verify Google ID token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = (claims.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"detail": "Google account has no verified email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            username = email
            if User.objects.filter(username=username).exists():
                username = f"{email}__google"
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=claims.get("name", "") or "",
            )
            user.set_unusable_password()
            user.save(update_fields=["password"])

        UserProfile.objects.get_or_create(user=user)
        return Response({**issue_tokens(user), "user": _me_payload(user)})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError:
            return Response(
                {"detail": "Token is invalid or already blacklisted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class PasswordResetView(APIView):
    """Stub: always accepts the request but sends no email yet."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"detail": "If an account exists for that email, a reset link will be sent."},
            status=status.HTTP_202_ACCEPTED,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_me_payload(request.user))

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(_me_payload(request.user))