from rest_framework import serializers

from .availability import next_available_slot
from .models import Availability, Therapist

WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ["id", "weekday", "start_time", "end_time"]


class TherapistListSerializer(serializers.ModelSerializer):
    top_tags = serializers.SerializerMethodField()
    next_available = serializers.SerializerMethodField()
    availability_badge = serializers.SerializerMethodField()

    class Meta:
        model = Therapist
        fields = [
            "id",
            "name",
            "degree",
            "experience_years",
            "tags",
            "top_tags",
            "session_price_inr",
            "session_duration_min",
            "photo_url",
            "rating",
            "next_available",
            "availability_badge",
        ]

    def get_top_tags(self, obj):
        return list(obj.tags or [])[:2]

    def get_next_available(self, obj):
        slot = next_available_slot(obj)
        return slot["start_dt"].isoformat() if slot else None

    def get_availability_badge(self, obj):
        return "available" if self.get_next_available(obj) else "fully_booked"


class TherapistDetailSerializer(serializers.ModelSerializer):
    availabilities = AvailabilitySerializer(many=True, read_only=True)
    next_available = serializers.SerializerMethodField()

    class Meta:
        model = Therapist
        fields = [
            "id",
            "name",
            "degree",
            "experience_years",
            "bio",
            "tags",
            "session_price_inr",
            "session_duration_min",
            "photo_url",
            "rating",
            "is_active",
            "availabilities",
            "next_available",
        ]

    def get_next_available(self, obj):
        slot = next_available_slot(obj)
        return slot["start_dt"].isoformat() if slot else None


class SlotSerializer(serializers.Serializer):
    start_dt = serializers.DateTimeField()
    end_dt = serializers.DateTimeField()
    booked = serializers.BooleanField()


# ---------------------------------------------------------------------------
# Therapist portal (therapist-facing website)
# ---------------------------------------------------------------------------
class TherapistPortalSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    timezone = serializers.SerializerMethodField()

    class Meta:
        model = Therapist
        fields = [
            "id",
            "name",
            "degree",
            "experience_years",
            "bio",
            "tags",
            "session_price_inr",
            "session_duration_min",
            "rating",
            "is_active",
            "credits",
            "timezone",
        ]

    def get_timezone(self, obj) -> str:
        return "Asia/Kolkata"


class PortalAvailabilitySerializer(serializers.ModelSerializer):
    weekday_label = serializers.SerializerMethodField()

    class Meta:
        model = Availability
        fields = ["id", "weekday", "weekday_label", "start_time", "end_time"]

    def get_weekday_label(self, obj) -> str:
        if 0 <= obj.weekday <= 6:
            return WEEKDAY_LABELS[obj.weekday]
        return ""


class PortalAvailabilityWriteSerializer(serializers.Serializer):
    weekday = serializers.IntegerField(min_value=0, max_value=6)
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()

    def validate(self, attrs):
        if attrs["start_time"] >= attrs["end_time"]:
            raise serializers.ValidationError("end_time must be after start_time.")
        return attrs