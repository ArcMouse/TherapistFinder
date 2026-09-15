"""Session reminder emails.

A booking's Zoom link is emailed to the client a fixed number of minutes
before the session starts (default 30). `send_due_reminders()` is idempotent:
each booking is reminded at most once, tracked by `Booking.reminder_sent_at`.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import Booking
from .serializers import format_ist

logger = logging.getLogger(__name__)


def _reminder_body(booking) -> str:
    client = booking.user.get_full_name() or booking.user.first_name or booking.user.email
    therapist = booking.therapist.name
    return (
        f"Hi {client},\n\n"
        f"Your MindEase session with {therapist} starts soon.\n\n"
        f"Time (IST): {format_ist(booking.start_dt)}\n"
        f"Duration: {booking.therapist.session_duration_min} minutes\n"
        f"Join Zoom: {booking.zoom_link}\n\n"
        f"Please join a couple of minutes early and find a quiet, private space.\n\n"
        f"— The MindEase team"
    )


def send_due_reminders(*, now=None, window_minutes: int | None = None) -> int:
    """Email the Zoom link for confirmed sessions starting within the window.

    Returns the number of reminders sent.
    """
    now = now or timezone.now()
    window = window_minutes if window_minutes is not None else settings.SESSION_REMINDER_MINUTES
    cutoff = now + timedelta(minutes=window)

    due = (
        Booking.objects.filter(
            status="confirmed",
            reminder_sent_at__isnull=True,
            start_dt__gt=now,
            start_dt__lte=cutoff,
        )
        .select_related("user", "therapist")
        .order_by("start_dt")
    )

    sent = 0
    for booking in due:
        if not booking.zoom_link:
            continue
        send_mail(
            subject=f"Your MindEase session starts in {window} minutes",
            message=_reminder_body(booking),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[booking.user.email],
            fail_silently=False,
        )
        booking.reminder_sent_at = now
        booking.save(update_fields=["reminder_sent_at"])
        sent += 1
        logger.info("Sent session reminder for booking %s", booking.id)

    return sent