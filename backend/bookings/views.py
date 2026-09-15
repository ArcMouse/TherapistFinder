"""Booking endpoints. `book_session()` is the only service integration point."""

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BookedSlot, Booking
from .serializers import BookingSerializer, CreateBookingSerializer
from .services import book_session


class BookingListCreateView(APIView):
    def get(self, request):
        bookings = (
            Booking.objects.filter(user=request.user)
            .select_related("therapist")
            .order_by("-start_dt")
        )
        return Response(BookingSerializer(bookings, many=True).data)

    def post(self, request):
        serializer = CreateBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            booking = book_session(
                user=request.user,
                therapist=serializer.validated_data["therapist"],
                start_dt=serializer.validated_data["start_dt"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            BookingSerializer(booking).data, status=status.HTTP_201_CREATED
        )


class BookingDetailView(APIView):
    def delete(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, user=request.user)
        if booking.status != "cancelled":
            with transaction.atomic():
                booking.status = "cancelled"
                booking.save(update_fields=["status"])
                BookedSlot.objects.filter(booking=booking).delete()
        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)