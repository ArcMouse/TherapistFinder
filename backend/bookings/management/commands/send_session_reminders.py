"""Email the Zoom link for sessions starting within the next N minutes.

Run periodically (cron, systemd timer, or the built-in `--loop`):

    python manage.py send_session_reminders              # one pass
    python manage.py send_session_reminders --loop       # poll every 60s

Recommended cron entry (every minute):

    * * * * * cd /srv/mindease/backend && .venv/bin/python manage.py send_session_reminders

The command is idempotent: each booking is reminded at most once.
"""

import time

from django.conf import settings
from django.core.management.base import BaseCommand

from bookings.reminders import send_due_reminders


class Command(BaseCommand):
    help = "Send Zoom-link reminder emails for sessions starting soon."

    def add_arguments(self, parser):
        parser.add_argument(
            "--window-minutes",
            type=int,
            default=settings.SESSION_REMINDER_MINUTES,
            help="Send when the session starts within this many minutes (default 30).",
        )
        parser.add_argument("--loop", action="store_true", help="Poll continuously.")
        parser.add_argument(
            "--interval", type=int, default=60, help="Seconds between polls in --loop mode."
        )

    def handle(self, *args, **options):
        window = options["window_minutes"]
        if not options["loop"]:
            sent = send_due_reminders(window_minutes=window)
            self.stdout.write(self.style.SUCCESS(f"Reminders sent: {sent}"))
            return

        self.stdout.write(
            self.style.WARNING(
                f"Polling for sessions starting within {window} minutes every "
                f"{options['interval']}s. Press Ctrl+C to stop."
            )
        )
        try:
            while True:
                sent = send_due_reminders(window_minutes=window)
                if sent:
                    self.stdout.write(self.style.SUCCESS(f"Reminders sent: {sent}"))
                time.sleep(options["interval"])
        except KeyboardInterrupt:  # pragma: no cover - interactive
            self.stdout.write("Stopped.")