"""Therapist, availability and natural-language search endpoints."""

from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from .availability import slots_for_week
from .models import Therapist
from .search import search_therapists
from .serializers import TherapistDetailSerializer, TherapistListSerializer


class TherapistListView(APIView):
    """List therapists with query, tag, price and availability filters."""

    def get(self, request):
        query = request.query_params.get("q") or request.query_params.get("query")
        if query:
            results = search_therapists(query)
            return Response(TherapistListSerializer(results, many=True).data)

        queryset = Therapist.objects.filter(is_active=True).prefetch_related("availabilities")

        min_price = request.query_params.get("min_price")
        max_price = request.query_params.get("max_price")
        if min_price:
            queryset = queryset.filter(session_price_inr__gte=min_price)
        if max_price:
            queryset = queryset.filter(session_price_inr__lte=max_price)

        results = list(queryset)

        tags = request.query_params.getlist("tags") or request.query_params.getlist("tag")
        if tags:
            selected = {tag.lower() for tag in ",".join(tags).split(",") if tag}
            results = [t for t in results if selected & {str(x).lower() for x in (t.tags or [])}]

        language = request.query_params.get("language")
        if language:
            needle = language.lower()
            results = [
                t
                for t in results
                if needle in " ".join(str(x).lower() for x in (t.tags or []))
                or needle in t.bio.lower()
            ]

        available_from = request.query_params.get("available_from")
        available_to = request.query_params.get("available_to")
        if available_from or available_to:
            results = _filter_by_availability(results, available_from, available_to)

        results = sorted(results, key=lambda t: (-float(t.rating), t.name))[:20]
        return Response(TherapistListSerializer(results, many=True).data)


class TherapistDetailView(APIView):
    def get(self, request, pk):
        therapist = get_object_or_404(
            Therapist.objects.prefetch_related("availabilities"), pk=pk, is_active=True
        )
        return Response(TherapistDetailSerializer(therapist).data)


class TherapistAvailabilityView(APIView):
    """Concrete weekly slots, with booked state resolved."""

    def get(self, request, pk):
        therapist = get_object_or_404(
            Therapist.objects.prefetch_related("availabilities"), pk=pk
        )
        week = request.query_params.get("week")
        slots = slots_for_week(therapist, week)
        return Response(
            {
                "therapist_id": therapist.id,
                "week": week,
                "session_duration_min": therapist.session_duration_min,
                "slots": [
                    {
                        "start_dt": slot["start_dt"].isoformat(),
                        "end_dt": slot["end_dt"].isoformat(),
                        "booked": slot["booked"],
                    }
                    for slot in slots
                ],
            }
        )


class SearchView(APIView):
    """Natural-language vector search over therapist name, degree, bio and tags."""

    def get(self, request):
        query = request.query_params.get("q", "")
        results = search_therapists(query)
        return Response(
            {
                "query": query,
                "count": len(results),
                "results": TherapistListSerializer(results, many=True).data,
            }
        )


def _filter_by_availability(results, available_from, available_to):
    """Keep therapists with at least one free slot inside the requested window.

    The window may arrive as an explicit-offset or UTC (`Z`) ISO string. Calendar
    days are derived in the server timezone (IST) and slots are compared as
    instants, so a UTC range that spans the intended local day is still matched.
    """
    from datetime import timedelta

    from dateparser import parse as parse_date
    from django.utils import timezone

    from .availability import slots_for_day

    start = parse_date(available_from) if available_from else None
    end = parse_date(available_to) if available_to else None

    if start is None and end is None:
        return list(results)

    tz = timezone.get_current_timezone()
    anchor = start or end
    first_day = timezone.localtime(anchor, tz).date()
    last_day = timezone.localtime(end, tz).date() if end else first_day
    if last_day < first_day:
        first_day, last_day = last_day, first_day

    matches = []
    for therapist in results:
        day = first_day
        found = False
        while day <= last_day and not found:
            for slot in slots_for_day(therapist, day):
                if slot["booked"]:
                    continue
                if start and slot["start_dt"] < start:
                    continue
                if end and slot["start_dt"] > end:
                    continue
                matches.append(therapist)
                found = True
                break
            day += timedelta(days=1)
    return matches