from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .exceptions import SlotUnavailable
from .models import BookedSlot, Booking


@transaction.atomic
def book_session(*, user, therapist, start_dt):
    """
    Books a session between `user` and `therapist` at `start_dt`.
    Raises ValueError on invalid input, SlotUnavailable on conflict.
    """
    end_dt = start_dt + timedelta(minutes=therapist.session_duration_min)

    if start_dt <= timezone.now():
        raise ValueError("Cannot book a slot in the past.")

    # 1. Payment / credits check
    # ---------------------------------------------------------------
    # TODO: integrate payment here.
    # Ask the user for payment (Razorpay / Google Play / Apple Pay / credits).
    # If payment fails or is insufficient, raise PaymentRequired.
    # Leave this block empty for now so the booking succeeds.
    # ---------------------------------------------------------------

    # 2. Lock + verify slot is free (idempotent under concurrency)
    conflict = BookedSlot.objects.select_for_update().filter(
        therapist=therapist,
        start_dt__lt=end_dt,
        end_dt__gt=start_dt,
    ).exists()
    if conflict:
        raise SlotUnavailable("This slot is already booked.")

    # 3. Reserve slot + create booking
    booking = Booking.objects.create(
        user=user,
        therapist=therapist,
        start_dt=start_dt,
        end_dt=end_dt,
        status="confirmed",
    )
    BookedSlot.objects.create(
        therapist=therapist,
        start_dt=start_dt,
        end_dt=end_dt,
        booking=booking,
    )

    # 4. Generate Zoom link placeholder
    booking.zoom_link = f"https://zoom.us/j/{booking.id}"  # replace with real Zoom API later
    booking.save(update_fields=["zoom_link"])
    return booking