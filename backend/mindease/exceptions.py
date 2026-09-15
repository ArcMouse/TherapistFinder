"""DRF exception handling: map domain exceptions to sensible HTTP codes."""

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def mindease_exception_handler(exc, context):
    from bookings.exceptions import PaymentRequired, SlotUnavailable

    if isinstance(exc, SlotUnavailable):
        return Response({"detail": str(exc)}, status=409)
    if isinstance(exc, PaymentRequired):
        return Response({"detail": str(exc)}, status=402)
    return drf_exception_handler(exc, context)