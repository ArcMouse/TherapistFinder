"""Keep therapist embeddings in sync with their content."""

from django.db.models.signals import post_save
from django.dispatch import receiver

from mindease.embeddings import encode

from .models import Therapist


@receiver(post_save, sender=Therapist)
def update_therapist_embedding(sender, instance, **kwargs):
    """Encode the therapist's searchable text once, on create/update."""
    vector = encode(instance.embedding_text())
    if vector is None:
        return
    Therapist.objects.filter(pk=instance.pk).update(embedding=vector)
    instance.embedding = vector