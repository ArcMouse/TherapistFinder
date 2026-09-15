"""Availability slot computation.

Slot rules (`Availability`) are weekly and recurring; `BookedSlot` rows are
concrete reserved instants. This module turns the two into the concrete,
timezone-aware slots the mobile client renders.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

from django.utils import timezone


def parse_week(week: str | None) -> tuple[date, date]:
    """Parse an ISO week like ``2026-37`` into ``(monday, sunday)``.

    Falls back to the week containing today when the value is missing/invalid.
    """
    today = timezone.localdate()
    if week:
        try:
            year_str, week_str = week.split("-")
            year, week_number = int(year_str), int(week_str)
            monday = date.fromisocalendar(year, week_number, 1)
            return monday, monday + timedelta(days=6)
        except (ValueError, TypeError):
            pass
    monday = today - timedelta(days=today.weekday())
    return monday, monday + timedelta(days=6)


def _overlaps_booked(therapist, start_dt, end_dt) -> bool:
    return therapist.booked_slots.filter(
        start_dt__lt=end_dt, end_dt__gt=start_dt
    ).exists()


def slots_for_day(therapist, day: date, *, now=None) -> list[dict]:
    """All bookable slots for ``therapist`` on ``day``."""
    now = now or timezone.now()
    duration = timedelta(minutes=therapist.session_duration_min)
    tz = timezone.get_current_timezone()
    slots: list[dict] = []

    rules = [a for a in therapist.availabilities.all() if a.weekday == day.weekday()]
    for rule in rules:
        cursor = datetime.combine(day, rule.start_time)
        end_of_rule = datetime.combine(day, rule.end_time)
        while cursor + duration <= end_of_rule:
            start_dt = timezone.make_aware(cursor, tz)
            end_dt = start_dt + duration
            if start_dt > now:
                slots.append(
                    {
                        "start_dt": start_dt,
                        "end_dt": end_dt,
                        "booked": _overlaps_booked(therapist, start_dt, end_dt),
                    }
                )
            cursor += duration
    slots.sort(key=lambda s: s["start_dt"])
    return slots


def slots_for_week(therapist, week: str | None) -> list[dict]:
    """All bookable slots in the given ISO week (booked ones flagged)."""
    monday, _sunday = parse_week(week)
    slots: list[dict] = []
    for offset in range(7):
        slots.extend(slots_for_day(therapist, monday + timedelta(days=offset)))
    return slots


def next_available_slot(therapist, *, horizon_days: int = 14, now=None):
    """The earliest non-booked future slot, or ``None``."""
    now = now or timezone.now()
    start_day = timezone.localdate(now)
    for offset in range(horizon_days):
        for slot in slots_for_day(therapist, start_day + timedelta(days=offset), now=now):
            if not slot["booked"]:
                return slot
    return None