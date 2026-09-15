from datetime import timedelta
from zoneinfo import ZoneInfo

from rest_framework import serializers

from therapists.models import Therapist

from .models import Booking

IST = ZoneInfo("Asia/Kolkata")


def format_ist(value) -> str:
    """Format an aware datetime in IST (the clinician-facing timezone)."""
    if value is None:
        return ""
    return value.astimezone(IST).strftime("%a, %d %b %Y · %I:%M %p IST")


class BookingSerializer(serializers.ModelSerializer):
    therapist_name = serializers.CharField(source="therapist.name", read_only=True)
    therapist_degree = serializers.CharField(source="therapist.degree", read_only=True)
    therapist_photo_url = serializers.CharField(source="therapist.photo_url", read_only=True)
    session_price_inr = serializers.DecimalField(
        source="therapist.session_price_inr", max_digits=8, decimal_places=2, read_only=True
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "therapist",
            "therapist_name",
            "therapist_degree",
            "therapist_photo_url",
            "session_price_inr",
            "start_dt",
            "end_dt",
            "status",
            "zoom_link",
        ]


class CreateBookingSerializer(serializers.Serializer):
    therapist = serializers.PrimaryKeyRelatedField(
        queryset=Therapist.objects.filter(is_active=True)
    )
    start_dt = serializers.DateTimeField()

    def validate_start_dt(self, value):
        from django.utils import timezone

        if value <= timezone.now():
            raise serializers.ValidationError("Cannot book a slot in the past.")
        return value


class TherapistSessionSerializer(serializers.ModelSerializer):
    """A booking as seen by the therapist portal — always rendered in IST."""

    start_dt_ist = serializers.SerializerMethodField()
    end_dt_ist = serializers.SerializerMethodField()
    reminder_at_ist = serializers.SerializerMethodField()
    duration_min = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    client_email = serializers.CharField(source="user.email", read_only=True)
    is_upcoming = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "status",
            "start_dt",
            "end_dt",
            "start_dt_ist",
            "end_dt_ist",
            "duration_min",
            "client_name",
            "client_email",
            "zoom_link",
            "reminder_sent_at",
            "reminder_at_ist",
            "is_upcoming",
        ]

    def get_start_dt_ist(self, obj) -> str:
        return format_ist(obj.start_dt)

    def get_end_dt_ist(self, obj) -> str:
        return format_ist(obj.end_dt)

    def get_duration_min(self, obj) -> int:
        return int((obj.end_dt - obj.start_dt).total_seconds() // 60)

    def get_client_name(self, obj) -> str:
        user = obj.user
        return user.get_full_name() or user.first_name or user.email.split("@")[0]

    def get_reminder_at_ist(self, obj) -> str:
        from django.conf import settings

        return format_ist(obj.start_dt - timedelta(minutes=settings.SESSION_REMINDER_MINUTES))

    def get_is_upcoming(self, obj) -> bool:
        from django.utils import timezone

        return obj.status != "cancelled" and obj.start_dt >= timezone.now()