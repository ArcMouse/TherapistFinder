from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    # -- Email / password --------------------------------------------------
    def test_register_creates_user_and_returns_tokens(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "newuser@example.com",
                "password": "SuperSecret123",
                "password_confirm": "SuperSecret123",
                "name": "New User",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "newuser@example.com")

        user = User.objects.get(email="newuser@example.com")
        self.assertTrue(user.check_password("SuperSecret123"))
        self.assertTrue(hasattr(user, "profile"))
        self.assertFalse(user.profile.onboarded)

    def test_register_rejects_duplicate_email(self):
        payload = {
            "email": "dup@example.com",
            "password": "SuperSecret123",
            "password_confirm": "SuperSecret123",
            "name": "Dup",
        }
        self.client.post("/api/auth/register/", payload, format="json")
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(User.objects.filter(email="dup@example.com").count(), 1)

    def test_login_returns_tokens_for_valid_credentials(self):
        User.objects.create_user(
            username="login@example.com", email="login@example.com", password="SuperSecret123"
        )
        response = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "SuperSecret123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_rejects_invalid_credentials(self):
        User.objects.create_user(
            username="login2@example.com", email="login2@example.com", password="SuperSecret123"
        )
        response = self.client.post(
            "/api/auth/login/",
            {"email": "login2@example.com", "password": "wrong-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertNotIn("access", response.data)

    # -- Google ------------------------------------------------------------
    def test_google_endpoint_rejects_invalid_id_token(self):
        with mock.patch(
            "accounts.views.id_token.verify_oauth2_token",
            side_effect=ValueError("bad token"),
        ):
            response = self.client.post(
                "/api/auth/google/", {"id_token": "not-a-real-token"}, format="json"
            )
        self.assertEqual(response.status_code, 401)

    def test_google_endpoint_creates_user_on_valid_token(self):
        claims = {"email": "googleuser@example.com", "name": "Google User", "email_verified": True}
        with mock.patch(
            "accounts.views.id_token.verify_oauth2_token", return_value=claims
        ):
            response = self.client.post(
                "/api/auth/google/", {"id_token": "valid-token"}, format="json"
            )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        user = User.objects.get(email="googleuser@example.com")
        self.assertTrue(hasattr(user, "profile"))
        self.assertFalse(user.has_usable_password())

        # A second sign-in reuses the same account.
        with mock.patch(
            "accounts.views.id_token.verify_oauth2_token", return_value=claims
        ):
            response = self.client.post(
                "/api/auth/google/", {"id_token": "valid-token"}, format="json"
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.filter(email="googleuser@example.com").count(), 1)

    # -- Protected routes --------------------------------------------------
    def test_protected_endpoint_requires_token(self):
        response = self.client.get("/api/me/")
        self.assertEqual(response.status_code, 401)

    def test_protected_endpoint_accepts_valid_token(self):
        User.objects.create_user(
            username="me@example.com", email="me@example.com", password="SuperSecret123"
        )
        login = self.client.post(
            "/api/auth/login/",
            {"email": "me@example.com", "password": "SuperSecret123"},
            format="json",
        )
        token = login.data["access"]
        response = self.client.get("/api/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], "me@example.com")

    def test_me_patch_updates_onboarding_fields(self):
        user = User.objects.create_user(
            username="patch@example.com", email="patch@example.com", password="SuperSecret123"
        )
        self.client.force_authenticate(user=user)
        response = self.client.patch(
            "/api/me/",
            {"language": "en", "country": "IN", "onboarded": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        user.profile.refresh_from_db()
        self.assertTrue(user.profile.onboarded)
        self.assertEqual(user.profile.country, "IN")

    def test_password_reset_returns_202(self):
        response = self.client.post(
            "/api/auth/password-reset/", {"email": "x@example.com"}, format="json"
        )
        self.assertEqual(response.status_code, 202)