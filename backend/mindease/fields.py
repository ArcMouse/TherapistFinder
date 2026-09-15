"""Portable model fields.

`VectorField` and `TagsField` transparently switch implementation based on the
configured database engine so the same model code runs on PostgreSQL (with
pgvector / ArrayField, used in production) and on SQLite (used for local dev and
the test suite).
"""

import json

from django.conf import settings
from django.db import models

IS_POSTGRES = getattr(settings, "IS_POSTGRES", False)


if IS_POSTGRES:  # pragma: no cover - exercised only on PostgreSQL
    from pgvector.django import VectorField  # noqa: F401

    from django.contrib.postgres.fields import ArrayField

    class TagsField(ArrayField):  # type: ignore[misc]
        """Array of short tag strings (PostgreSQL native array)."""

        def __init__(self, base_field=None, *args, **kwargs):
            base_field = base_field or models.CharField(max_length=40)
            super().__init__(base_field, *args, **kwargs)

        def deconstruct(self):
            name, path, args, kwargs = super().deconstruct()
            path = "mindease.fields.TagsField"
            args = []
            kwargs.pop("base_field", None)
            return name, path, args, kwargs

else:

    class VectorField(models.TextField):  # type: ignore[no-redef]
        """JSON-encoded float list with Python-side cosine similarity.

        Mirrors the `pgvector.django.VectorField` API (accepts `dimensions`)
        so models and serializers stay backend agnostic.
        """

        description = "Portable embedding vector (JSON encoded on non-PostgreSQL backends)"

        def __init__(self, *args, dimensions=None, **kwargs):
            self.dimensions = dimensions
            super().__init__(*args, **kwargs)

        def deconstruct(self):
            name, path, args, kwargs = super().deconstruct()
            path = "mindease.fields.VectorField"
            kwargs["dimensions"] = self.dimensions
            return name, path, args, kwargs

        def from_db_value(self, value, expression, connection):
            if value is None or isinstance(value, list):
                return value
            try:
                return json.loads(value)
            except (TypeError, ValueError):
                return None

        def to_python(self, value):
            if value is None or isinstance(value, list):
                return value
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except ValueError:
                    return None
            return value

        def get_prep_value(self, value):
            if value is None:
                return None
            if isinstance(value, str):
                return value
            return json.dumps([float(v) for v in value])

        def value_to_string(self, obj):
            return self.get_prep_value(self.value_from_object(obj))

    class TagsField(models.JSONField):  # type: ignore[no-redef]
        """List of tags stored as JSON on non-PostgreSQL backends."""

        def __init__(self, *args, **kwargs):
            kwargs.setdefault("default", list)
            super().__init__(*args, **kwargs)

        def deconstruct(self):
            name, path, args, kwargs = super().deconstruct()
            path = "mindease.fields.TagsField"
            kwargs.pop("base_field", None)
            return name, path, args, kwargs