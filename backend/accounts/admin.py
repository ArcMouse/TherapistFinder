from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "language", "country", "onboarded")
    list_filter = ("language", "country", "onboarded")
    search_fields = ("user__email", "user__username")