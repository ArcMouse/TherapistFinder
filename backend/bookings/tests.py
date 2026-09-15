from datetime import timedelta
from io import StringIO

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from therapists.models import Therapist

from .exceptions import SlotUnavailable
from .models import BookedSlot, Booking
from .services import book_session

User = get_user_model()


def make_therapist(*, email="therapist@example.com", duration=50, **kwargs):
    user = User.objects.create_user(username=email, email=email, password="SuperSecret123")
    return Therapist.objects.create(
        user=user,
        name=kwargs.get("name", "Dr. Test"),
        degree="M.A. Psychology",
        experience_years=5,
        bio="Testing bio.",
        tags=["anxiety"],
        session_price_inr=1000,
        session_duration_min=duration,
        rating=4.0,
        is_active=True,
    )


class BookingServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="booker@example.com", email="booker@example.com", password="SuperSecret123"
        )
        self.therapist = make_therapist()
        self.start = timezone.now() + timedelta(days=7)

    def test_book_session_creates_booking_and_blocks_slot(self):
        booking = book_session(user=self.user, therapist=self.therapist, start_dt=self.start)

        self.assertIsNotNone(booking.pk)
        self.assertEqual(booking.status, "confirmed")
        self.assertEqual(booking.user, self.user)
        self.assertEqual(booking.end_dt, self.start + timedelta(minutes=50))
        self.assertIn(str(booking.id), booking.zoom_link)

        slot = BookedSlot.objects.get(booking=booking)
        self.assertEqual(slot.therapist, self.therapist)
        self.assertEqual(slot.start_dt, self.start)

    def test_book_session_raises_on_overlapping_slot(self):
        book_session(user=self.user, therapist=self.therapist, start_dt=self.start)
        other = User.objects.create_user(
            username="other@example.com", email="other@example.com", password="SuperSecret123"
        )
        with self.assertRaises(SlotUnavailable):
            book_session(user=other, therapist=self.therapist, start_dt=self.start)

    def test_book_session_raises_on_past_slot(self):
        with self.assertRaises(ValueError):
            book_session(
                user=self.user,
                therapist=self.therapist,
                start_dt=timezone.now() - timedelta(hours=1),
            )


class CancelBookingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="canceller@example.com",
            email="canceller@example.com",
            password="SuperSecret123",
        )
        self.therapist = make_therapist()
        self.start = timezone.now() + timedelta(days=7)

    def test_cancel_frees_slot(self):
        booking = book_session(user=self.user, therapist=self.therapist, start_dt=self.start)
        self.assertEqual(BookedSlot.objects.count(), 1)

        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.delete(f"/api/bookings/{booking.id}/")

        self.assertEqual(response.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, "cancelled")
        self.assertEqual(BookedSlot.objects.count(), 0)

        # The freed slot can be rebooked.
        rebooked = book_session(user=self.user, therapist=self.therapist, start_dt=self.start)
        self.assertEqual(rebooked.status, "confirmed")


class BookingApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="apiuser@example.com", email="apiuser@example.com", password="SuperSecret123"
        )
        self.therapist = make_therapist()
        self.start = timezone.now() + timedelta(days=7)
        self.client = APIClient()

    def test_post_bookings_requires_auth(self):
        response = self.client.post(
            "/api/bookings/",
            {"therapist": self.therapist.id, "start_dt": self.start.isoformat()},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_post_bookings_returns_201_and_payload(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/bookings/",
            {"therapist": self.therapist.id, "start_dt": self.start.isoformat()},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "confirmed")
        self.assertEqual(response.data["therapist"], self.therapist.id)
        self.assertTrue(response.data["zoom_link"])
        self.assertEqual(Booking.objects.filter(user=self.user).count(), 1)

    def test_post_bookings_returns_409_on_conflict(self):
        self.client.force_authenticate(user=self.user)
        payload = {"therapist": self.therapist.id, "start_dt": self.start.isoformat()}
        first = self.client.post("/api/bookings/", payload, format="json")
        self.assertEqual(first.status_code, 201)

        second = self.client.post("/api/bookings/", payload, format="json")
        self.assertEqual(second.status_code, 409)
        self.assertIn("already booked", second.data["detail"].lower())

    def test_list_returns_only_own_bookings(self):
        other = User.objects.create_user(
            username="other2@example.com", email="other2@example.com", password="SuperSecret123"
        )
        book_session(user=other, therapist=self.therapist, start_dt=self.start)
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/bookings/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

class SessionReminderTests(TestCase):
    """Zoom-link reminder emails are sent 30 minutes before a session."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="remindee@example.com",
            email="remindee@example.com",
            password="SuperSecret123",
            first_name="Remindee",
        )
        self.therapist = make_therapist()
        self._old_backend = settings.EMAIL_BACKEND
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

    def tearDown(self):
        settings.EMAIL_BACKEND = self._old_backend
        mail.outbox = []

    def test_reminder_is_sent_within_the_window(self):
        from .reminders import send_due_reminders

        booking = book_session(
            user=self.user,
            therapist=self.therapist,
            start_dt=timezone.now() + timedelta(minutes=25),
        )
        sent = send_due_reminders()
        self.assertEqual(sent, 1)
        self.assertEqual(len(mail.outbox), 1)

        message = mail.outbox[0]
        self.assertIn(self.user.email, message.to)
        self.assertIn(booking.zoom_link, message.body)
        self.assertIn("IST", message.body)

        booking.refresh_from_db()
        self.assertIsNotNone(booking.reminder_sent_at)

    def test_reminder_is_not_sent_too_early(self):
        from .reminders import send_due_reminders

        book_session(
            user=self.user,
            therapist=self.therapist,
            start_dt=timezone.now() + timedelta(hours=3),
        )
        self.assertEqual(send_due_reminders(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_reminder_is_idempotent(self):
        from .reminders import send_due_reminders

        book_session(
            user=self.user,
            therapist=self.therapist,
            start_dt=timezone.now() + timedelta(minutes=20),
        )
        self.assertEqual(send_due_reminders(), 1)
        self.assertEqual(send_due_reminders(), 0)
        self.assertEqual(len(mail.outbox), 1)

    def test_management_command_sends_and_reports(self):
        book_session(
            user=self.user,
            therapist=self.therapist,
            start_dt=timezone.now() + timedelta(minutes=29),
        )
        out = StringIO()
        call_command("send_session_reminders", stdout=out)
        self.assertIn("Reminders sent: 1", out.getvalue())
        self.assertEqual(len(mail.outbox), 1)

    def test_cancelled_sessions_are_not_reminded(self):
        from .reminders import send_due_reminders

        booking = book_session(
            user=self.user,
            therapist=self.therapist,
            start_dt=timezone.now() + timedelta(minutes=20),
        )
        booking.status = "cancelled"
        booking.save(update_fields=["status"])
        self.assertEqual(send_due_reminders(), 0)
        self.assertEqual(len(mail.outbox), 0)
