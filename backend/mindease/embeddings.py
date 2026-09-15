"""Embedding helpers backed by sentence-transformers.

The model is loaded once per process and reused. Every helper degrades
gracefully: if the ML stack or the model weights are unavailable, encoding
returns ``None`` and callers fall back to keyword/full-text search.
"""

from __future__ import annotations

import logging
import math
import os
import threading

from django.conf import settings

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_model = None
_model_failed = False


def get_model():
    """Return the process-wide SentenceTransformer, or ``None`` if unavailable."""
    global _model, _model_failed
    if _model is not None:
        return _model
    if _model_failed:
        return None
    with _lock:
        if _model is not None:
            return _model
        if _model_failed:
            return None
        try:
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer(
                settings.EMBEDDING_MODEL_NAME,
                cache_folder=os.environ.get("SENTENCE_TRANSFORMERS_HOME"),
            )
            logger.info("Loaded embedding model %s", settings.EMBEDDING_MODEL_NAME)
        except Exception as exc:  # pragma: no cover - depends on local environment
            logger.warning("Embedding model unavailable, falling back to text search: %s", exc)
            _model_failed = True
            return None
    return _model


def is_available() -> bool:
    return get_model() is not None


def encode(text: str):
    """Encode ``text`` into a normalised 384-d vector, or ``None`` on failure."""
    if not text or not text.strip():
        return None
    model = get_model()
    if model is None:
        return None
    try:
        vector = model.encode([text], normalize_embeddings=True)[0]
        return [float(x) for x in vector]
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Failed to encode text: %s", exc)
        return None


def cosine_similarity(a, b) -> float:
    """Cosine similarity between two equal-length vectors (0.0 when invalid)."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def therapist_text(name: str, degree: str, bio: str, tags) -> str:
    """Build the canonical embedding text for a therapist."""
    tags = tags or []
    return f"{name} {degree} {bio} {' '.join(tags)}".strip()