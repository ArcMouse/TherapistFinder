from django.contrib import admin

from .models import BookedSlot, Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "therapist", "start_dt", "end_dt", "status")
    list_filter = ("status",)
    search_fields = ("user__email", "therapist__name")


@admin.register(BookedSlot)
class BookedSlotAdmin(admin.ModelAdmin):
    list_display = ("id", "therapist", "start_dt", "end_dt", "booking")