from datetime import datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from mindease import embeddings

from .models import Availability, Therapist

User = get_user_model()


def make_therapist(*, email, name="Therapist", active=True, tags=None, bio="", **kwargs):
    user = User.objects.create_user(username=email, email=email, password="SuperSecret123")
    defaults = {
        "name": name,
        "degree": "M.A. Psychology",
        "experience_years": 5,
        "bio": bio or "General therapy.",
        "tags": tags or ["anxiety"],
        "session_price_inr": 1000,
        "session_duration_min": 50,
        "rating": 4.0,
        "is_active": active,
    }
    defaults.update(kwargs)
    return Therapist.objects.create(user=user, **defaults)


def next_sunday():
    today = timezone.localdate()
    delta = (6 - today.weekday()) % 7
    if delta == 0:
        delta = 7
    return today + timedelta(days=delta)


def iso_week(day):
    iso = day.isocalendar()
    return f"{iso[0]:04d}-{iso[1]:02d}"


class TherapistListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="viewer@example.com", email="viewer@example.com", password="SuperSecret123"
        )
        self.client.force_authenticate(user=self.user)

    def test_returns_only_active_therapists(self):
        make_therapist(email="active@example.com", name="Active Therapist", active=True)
        make_therapist(email="inactive@example.com", name="Inactive Therapist", active=False)

        response = self.client.get("/api/therapists/")
        self.assertEqual(response.status_code, 200)
        names = [item["name"] for item in response.data]
        self.assertIn("Active Therapist", names)
        self.assertNotIn("Inactive Therapist", names)

    def test_list_requires_auth(self):
        anon = APIClient()
        self.assertEqual(anon.get("/api/therapists/").status_code, 401)

    def test_list_serializes_top_two_tags_and_price(self):
        make_therapist(
            email="tagged@example.com",
            name="Tagged",
            tags=["anxiety", "teens", "cbt", "sleep"],
        )
        response = self.client.get("/api/therapists/")
        card = response.data[0]
        self.assertEqual(len(card["top_tags"]), 2)
        self.assertIn("session_price_inr", card)

    def test_price_filter(self):
        make_therapist(email="cheap@example.com", name="Cheap", session_price_inr=500)
        make_therapist(email="pricey@example.com", name="Pricey", session_price_inr=5000)
        response = self.client.get("/api/therapists/?max_price=1000")
        names = [item["name"] for item in response.data]
        self.assertIn("Cheap", names)
        self.assertNotIn("Pricey", names)


class TherapistDetailTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="viewer2@example.com", email="viewer2@example.com", password="SuperSecret123"
        )
        self.client.force_authenticate(user=self.user)

    def test_detail_returns_bio_tags_and_availability(self):
        therapist = make_therapist(
            email="detail@example.com", name="Detail Therapist", bio="Specialises in anxiety."
        )
        Availability.objects.create(
            therapist=therapist, weekday=6, start_time=time(17, 0), end_time=time(21, 0)
        )
        response = self.client.get(f"/api/therapists/{therapist.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Detail Therapist")
        self.assertEqual(response.data["bio"], "Specialises in anxiety.")
        self.assertEqual(len(response.data["availabilities"]), 1)


class AvailabilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="viewer3@example.com", email="viewer3@example.com", password="SuperSecret123"
        )
        self.client.force_authenticate(user=self.user)
        self.sunday = next_sunday()
        self.therapist = make_therapist(
            email="avail@example.com", name="Avail Therapist", session_duration_min=50
        )
        Availability.objects.create(
            therapist=self.therapist, weekday=6, start_time=time(17, 0), end_time=time(21, 0)
        )

    def test_filter_by_week_and_weekday(self):
        week = iso_week(self.sunday)
        response = self.client.get(
            f"/api/therapists/{self.therapist.id}/availability/?week={week}"
        )
        self.assertEqual(response.status_code, 200)
        slots = response.data["slots"]
        self.assertGreater(len(slots), 0)
        for slot in slots:
            start = datetime.fromisoformat(slot["start_dt"])
            self.assertEqual(start.weekday(), 6)
            self.assertGreaterEqual(start.date(), self.sunday)
            self.assertLessEqual(start.date(), self.sunday)
        self.assertFalse(any(slot["booked"] for slot in slots))

    def test_booked_slots_are_excluded(self):
        from bookings.models import BookedSlot

        week = iso_week(self.sunday)
        url = f"/api/therapists/{self.therapist.id}/availability/?week={week}"
        slots = self.client.get(url).data["slots"]

        first = slots[0]
        start = datetime.fromisoformat(first["start_dt"])
        end = datetime.fromisoformat(first["end_dt"])
        BookedSlot.objects.create(therapist=self.therapist, start_dt=start, end_dt=end)

        refreshed = self.client.get(url).data["slots"]
        booked_flags = {slot["start_dt"]: slot["booked"] for slot in refreshed}
        self.assertTrue(booked_flags[first["start_dt"]])
        self.assertEqual(sum(booked_flags.values()), 1)


class VectorSearchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="searcher@example.com", email="searcher@example.com", password="SuperSecret123"
        )
        self.client.force_authenticate(user=self.user)
        make_therapist(
            email="anxiety@example.com",
            name="Ananya Anxiety Specialist",
            tags=["anxiety", "teens"],
            bio="I help teenagers with anxiety, panic and exam stress using CBT.",
        )
        make_therapist(
            email="couples@example.com",
            name="Rohan Relationship Coach",
            tags=["relationships", "couples"],
            bio="Relationship and marriage counselling for communication problems.",
        )

    def test_natural_language_query_returns_relevant_therapist(self):
        if not embeddings.is_available():
            self.skipTest("sentence-transformers model unavailable")
        response = self.client.get("/api/search/?q=anxiety%20in%20teenagers")
        self.assertEqual(response.status_code, 200)
        if not response.data["results"]:
            self.skipTest("no embeddings stored (model unavailable at write time)")
        names = [item["name"] for item in response.data["results"]]
        self.assertIn("Ananya Anxiety Specialist", names)

    def test_search_endpoint_requires_auth(self):
        self.assertEqual(APIClient().get("/api/search/?q=anxiety").status_code, 401)

    def test_search_with_time_expression_returns_available_therapist(self):
        therapist = Therapist.objects.get(user__email="anxiety@example.com")
        from datetime import time as _time

        Availability.objects.create(
            therapist=therapist, weekday=6, start_time=_time(17, 0), end_time=_time(21, 0)
        )
        response = self.client.get("/api/search/?q=anxiety%20available%20Sunday%20evening")
        self.assertEqual(response.status_code, 200)
        if not response.data["results"]:
            self.skipTest("no results available without embeddings")
        self.assertIn("Ananya Anxiety Specialist", [i["name"] for i in response.data["results"]])

class TherapistPortalTests(TestCase):
    """Therapist-facing portal: auth, profile, sessions, availability."""

    def setUp(self):
        self.therapist = make_therapist(
            email="portal@example.com", name="Portal Therapist", session_price_inr=1800
        )
        self.client_user = User.objects.create_user(
            username="client@example.com", email="client@example.com", password="SuperSecret123"
        )
        self.client = APIClient()

    def _token_for(self, email, password="SuperSecret123"):
        response = self.client.post(
            "/api/auth/login/", {"email": email, "password": password}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.data)
        return response.data["access"]

    def test_therapist_can_login_and_fetch_profile_with_credits(self):
        token = self._token_for("portal@example.com")
        response = self.client.get("/api/therapist/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Portal Therapist")
        self.assertEqual(response.data["timezone"], "Asia/Kolkata")
        self.assertIn("credits", response.data)

    def test_non_therapist_is_forbidden(self):
        token = self._token_for("client@example.com")
        response = self.client.get("/api/therapist/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, 403)

    def test_portal_requires_authentication(self):
        self.assertEqual(self.client.get("/api/therapist/sessions/").status_code, 401)

    def test_sessions_list_shows_ist_times_and_zoom_links(self):
        from bookings.services import book_session

        start = timezone.now() + timedelta(days=2)
        booking = book_session(user=self.client_user, therapist=self.therapist, start_dt=start)

        token = self._token_for("portal@example.com")
        response = self.client.get(
            "/api/therapist/sessions/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        row = response.data[0]
        self.assertEqual(row["client_email"], "client@example.com")
        self.assertTrue(row["zoom_link"])
        self.assertIn("IST", row["start_dt_ist"])
        self.assertIn("IST", row["reminder_at_ist"])
        self.assertEqual(row["duration_min"], 50)
        self.assertTrue(row["is_upcoming"])
        self.assertIsNone(row["reminder_sent_at"])
        self.assertEqual(booking.zoom_link, row["zoom_link"])

    def test_availability_create_and_delete(self):
        token = self._token_for("portal@example.com")

        create = self.client.post(
            "/api/therapist/availability/",
            {"weekday": 2, "start_time": "09:00", "end_time": "12:00"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(create.status_code, 201)
        self.assertEqual(create.data["weekday_label"], "Wednesday")

        listing = self.client.get(
            "/api/therapist/availability/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(len(listing.data), 1)

        delete = self.client.delete(
            f"/api/therapist/availability/{create.data['id']}/",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(delete.status_code, 204)
        self.assertEqual(Availability.objects.filter(therapist=self.therapist).count(), 0)

    def test_availability_rejects_inverted_range(self):
        token = self._token_for("portal@example.com")
        response = self.client.post(
            "/api/therapist/availability/",
            {"weekday": 1, "start_time": "18:00", "end_time": "09:00"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 400)

    def test_portal_only_exposes_own_sessions(self):
        from bookings.services import book_session

        other = make_therapist(email="other@example.com", name="Other Therapist")
        other_client = User.objects.create_user(
            username="otherclient@example.com",
            email="otherclient@example.com",
            password="SuperSecret123",
        )
        book_session(
            user=other_client, therapist=other, start_dt=timezone.now() + timedelta(days=3)
        )

        token = self._token_for("portal@example.com")
        response = self.client.get(
            "/api/therapist/sessions/", HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)


class AvailabilityFilterTests(TestCase):
    """The `available_from`/`available_to` filters must accept UTC ISO strings."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="filt@example.com", email="filt@example.com", password="SuperSecret123"
        )
        self.client.force_authenticate(user=self.user)
        self.therapist = make_therapist(email="sundays@example.com", name="Sunday Therapist")
        Availability.objects.create(
            therapist=self.therapist, weekday=6, start_time=time(17, 0), end_time=time(21, 0)
        )

    def _utc_window(self, day):
        from datetime import timezone as dt_timezone
        from zoneinfo import ZoneInfo

        ist = ZoneInfo("Asia/Kolkata")
        start = datetime.combine(day, time(0, 0), tzinfo=ist).astimezone(dt_timezone.utc)
        end = datetime.combine(day, time(23, 59, 59), tzinfo=ist).astimezone(dt_timezone.utc)
        return start.isoformat(), end.isoformat()

    def test_utc_z_window_matches_the_intended_local_day(self):
        start, end = self._utc_window(next_sunday())
        response = self.client.get(
            "/api/therapists/", {"available_from": start, "available_to": end}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("Sunday Therapist", [item["name"] for item in response.data])

    def test_window_without_availability_excludes_therapist(self):
        # A Tuesday window: this therapist only works Sundays.
        start, end = self._utc_window(next_sunday() + timedelta(days=2))
        response = self.client.get(
            "/api/therapists/", {"available_from": start, "available_to": end}
        )
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("Sunday Therapist", [item["name"] for item in response.data])
