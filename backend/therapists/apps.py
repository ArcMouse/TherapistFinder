from django.apps import AppConfig


class TherapistsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "therapists"

    def ready(self):
        from . import signals  # noqa: F401