from django.contrib import admin

from .models import Availability, Therapist


class AvailabilityInline(admin.TabularInline):
    model = Availability
    extra = 0


@admin.register(Therapist)
class TherapistAdmin(admin.ModelAdmin):
    list_display = ("name", "degree", "experience_years", "session_price_inr", "rating", "is_active")
    list_filter = ("is_active", "tags")
    search_fields = ("name", "degree", "bio")
    inlines = [AvailabilityInline]