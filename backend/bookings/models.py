from django.conf import settings
from django.db import models

from therapists.models import Therapist


class Booking(models.Model):
    STATUS = [
        ("pending", "pending"),
        ("confirmed", "confirmed"),
        ("cancelled", "cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings"
    )
    therapist = models.ForeignKey(
        Therapist, on_delete=models.CASCADE, related_name="bookings"
    )
    start_dt = models.DateTimeField()
    end_dt = models.DateTimeField()
    status = models.CharField(max_length=12, choices=STATUS, default="pending")
    zoom_link = models.URLField(blank=True)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-start_dt"]

    def __str__(self) -> str:  # pragma: no cover - repr helper
        return f"Booking<{self.pk} {self.status}>"


class BookedSlot(models.Model):
    therapist = models.ForeignKey(
        Therapist, related_name="booked_slots", on_delete=models.CASCADE
    )
    start_dt = models.DateTimeField()
    end_dt = models.DateTimeField()
    booking = models.OneToOneField(
        Booking,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="booked_slot",
    )

    class Meta:
        ordering = ["start_dt"]

    def __str__(self) -> str:  # pragma: no cover - repr helper
        return f"BookedSlot<{self.therapist_id} {self.start_dt}>"