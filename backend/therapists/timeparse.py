"""Lightweight natural-language time parsing for search queries.

Extracts a weekday and a coarse time-of-day window from free text such as
"available Sunday evenings" or "Saturday morning". Falls back to `dateparser`
for absolute dates when available.
"""

from __future__ import annotations

import re
from datetime import time

_WEEKDAYS = {
    "monday": 0,
    "mon": 0,
    "tuesday": 1,
    "tue": 1,
    "tues": 1,
    "wednesday": 2,
    "wed": 2,
    "thursday": 3,
    "thu": 3,
    "thur": 3,
    "thurs": 3,
    "friday": 4,
    "fri": 4,
    "saturday": 5,
    "sat": 5,
    "sunday": 6,
    "sun": 6,
}

_PERIODS = {
    "morning": (time(6, 0), time(12, 0)),
    "afternoon": (time(12, 0), time(17, 0)),
    "evening": (time(17, 0), time(21, 0)),
    "night": (time(19, 0), time(23, 59)),
}


def parse_time_constraints(query: str) -> dict:
    """Return ``{weekday, time_start, time_end}`` (values may be ``None``)."""
    result = {"weekday": None, "time_start": None, "time_end": None}
    if not query:
        return result
    text = query.lower()

    for name, index in sorted(_WEEKDAYS.items(), key=lambda kv: -len(kv[0])):
        if re.search(rf"\b{name}\b", text):
            result["weekday"] = index
            break

    for label, (start, end) in _PERIODS.items():
        if re.search(rf"\b{label}s?\b", text):
            result["time_start"], result["time_end"] = start, end
            break

    if result["weekday"] is None:
        result["weekday"] = _parse_with_dateparser(text)
    return result


def _parse_with_dateparser(text: str):
    """Best-effort absolute date parsing; returns a weekday index or ``None``."""
    try:
        import dateparser.search

        found = dateparser.search.search_dates(text, settings={"PREFER_DATES_FROM": "future"})
    except Exception:
        return None
    if not found:
        return None
    for _phrase, parsed in found:
        if parsed is not None:
            return parsed.weekday()
    return None