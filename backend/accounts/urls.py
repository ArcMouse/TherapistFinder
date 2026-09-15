from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    GoogleAuthView,
    LoginView,
    LogoutView,
    PasswordResetView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("google/", GoogleAuthView.as_view(), name="auth-google"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("password-reset/", PasswordResetView.as_view(), name="auth-password-reset"),
]