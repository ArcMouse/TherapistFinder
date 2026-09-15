from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    language = models.CharField(max_length=8, default="en")
    country = models.CharField(max_length=2, default="IN")
    preferred_timezone = models.CharField(max_length=64, default="Asia/Kolkata")
    onboarded = models.BooleanField(default=False)

    def __str__(self) -> str:  # pragma: no cover - repr helper
        return f"Profile<{self.user_id}>"