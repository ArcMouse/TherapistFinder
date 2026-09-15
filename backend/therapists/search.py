"""Therapist search: vector similarity with keyword/full-text fallback."""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.db.models import Q
from django.utils import timezone

from mindease.embeddings import cosine_similarity, encode

from .availability import slots_for_day
from .models import Therapist
from .timeparse import parse_time_constraints

logger = logging.getLogger(__name__)

LIMIT = 20


def _base_queryset():
    return Therapist.objects.filter(is_active=True).prefetch_related("availabilities")


def _has_embeddings(queryset) -> bool:
    return queryset.filter(embedding__isnull=False).exists()


def _vector_rank_python(queryset, vector, limit):
    scored = []
    for therapist in queryset:
        if not therapist.embedding:
            continue
        scored.append((cosine_similarity(therapist.embedding, vector), therapist))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [therapist for _score, therapist in scored[:limit]]


def _vector_rank_postgres(queryset, vector, limit):  # pragma: no cover - PostgreSQL only
    from pgvector.django import CosineDistance

    return list(
        queryset.filter(embedding__isnull=False)
        .annotate(distance=CosineDistance("embedding", vector))
        .order_by("distance")[:limit]
    )


def _text_rank(queryset, query, limit):
    terms = [term for term in (query or "").split() if len(term) > 2]
    if settings.IS_POSTGRES:  # pragma: no cover - PostgreSQL only
        from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

        search_vector = SearchVector("name", "degree", "bio")
        search_query = SearchQuery(query, search_type="websearch")
        ranked = (
            queryset.annotate(rank=SearchRank(search_vector, search_query))
            .filter(rank__gt=0)
            .order_by("-rank")
        )
        results = list(ranked[:limit])
        if results:
            return results

    matches = Q()
    for term in terms:
        matches |= Q(name__icontains=term)
        matches |= Q(degree__icontains=term)
        matches |= Q(bio__icontains=term)
    filtered = queryset.filter(matches) if terms else queryset
    return list(filtered.order_by("-rating", "name")[:limit])


def _slot_matches_window(slot, constraints) -> bool:
    start_time = slot["start_dt"].time()
    if constraints["time_start"] and constraints["time_end"]:
        if not (constraints["time_start"] <= start_time < constraints["time_end"]):
            return False
    return True


def _matches_time(therapist, constraints, *, now=None, horizon_days: int = 14) -> bool:
    now = now or timezone.now()
    today = timezone.localdate(now)
    for offset in range(horizon_days):
        day = today + timedelta(days=offset)
        if constraints["weekday"] is not None and day.weekday() != constraints["weekday"]:
            continue
        for slot in slots_for_day(therapist, day, now=now):
            if slot["booked"]:
                continue
            if _slot_matches_window(slot, constraints):
                return True
    return False


def search_therapists(query: str, *, limit: int = LIMIT, queryset=None):
    """Return active therapists ranked by relevance to ``query``.

    Uses pgvector cosine distance on PostgreSQL, Python cosine on portable
    backends, and keyword/full-text search when embeddings are unavailable.
    A parsed time expression (e.g. "Sunday evening") is applied as an
    availability filter when it leaves at least one candidate.
    """
    queryset = queryset if queryset is not None else _base_queryset()
    query = (query or "").strip()
    vector = encode(query)

    if vector is not None and _has_embeddings(queryset):
        if settings.IS_POSTGRES:  # pragma: no cover - PostgreSQL only
            candidates = _vector_rank_postgres(queryset, vector, limit)
        else:
            candidates = _vector_rank_python(queryset, vector, limit)
    else:
        candidates = _text_rank(queryset, query, limit)

    if not query:
        candidates = list(queryset.order_by("-rating", "name")[:limit])

    constraints = parse_time_constraints(query)
    time_active = constraints["weekday"] is not None or constraints["time_start"] is not None
    if time_active and candidates:
        filtered = [t for t in candidates if _matches_time(t, constraints)]
        if filtered:
            candidates = filtered

    return candidates[:limit]