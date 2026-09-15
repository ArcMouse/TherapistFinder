from django.conf import settings
from django.db import models

from mindease.fields import TagsField, VectorField


class Therapist(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="therapist"
    )
    name = models.CharField(max_length=120)
    degree = models.CharField(max_length=120)
    experience_years = models.PositiveIntegerField()
    bio = models.TextField()
    tags = TagsField(default=list)
    session_price_inr = models.DecimalField(max_digits=8, decimal_places=2)
    session_duration_min = models.PositiveIntegerField(default=50)
    photo_url = models.URLField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    # Demo/filler balance shown in the therapist portal. Not tied to payments.
    credits = models.PositiveIntegerField(default=12)
    embedding = VectorField(dimensions=settings.EMBEDDING_DIMENSIONS, null=True, blank=True)

    class Meta:
        ordering = ["-rating", "name"]

    def __str__(self) -> str:  # pragma: no cover - repr helper
        return self.name

    def embedding_text(self) -> str:
        from mindease.embeddings import therapist_text

        return therapist_text(self.name, self.degree, self.bio, self.tags)


class Availability(models.Model):
    therapist = models.ForeignKey(
        Therapist, related_name="availabilities", on_delete=models.CASCADE
    )
    weekday = models.IntegerField()  # 0=Mon .. 6=Sun
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        ordering = ["weekday", "start_time"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(weekday__gte=0) & models.Q(weekday__lte=6),
                name="availability_weekday_range",
            )
        ]

    def __str__(self) -> str:  # pragma: no cover - repr helper
        return f"{self.therapist_id} d{self.weekday} {self.start_time}-{self.end_time}"