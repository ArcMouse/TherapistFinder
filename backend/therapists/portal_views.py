"""Therapist-facing portal API.

These endpoints power the therapist area of the sales/portal website. Every
response exposes times in IST, because clinicians are always presented with
India Standard Time regardless of the client's own timezone.
"""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from bookings.serializers import TherapistSessionSerializer

from .models import Availability
from .permissions import IsTherapistUser
from .serializers import (
    PortalAvailabilitySerializer,
    PortalAvailabilityWriteSerializer,
    TherapistPortalSerializer,
)


class TherapistPortalMixin:
    permission_classes = [IsAuthenticated, IsTherapistUser]

    @property
    def therapist(self):
        return self.request.user.therapist


class TherapistMeView(TherapistPortalMixin, APIView):
    def get(self, request):
        return Response(TherapistPortalSerializer(self.therapist).data)


class TherapistSessionListView(TherapistPortalMixin, APIView):
    def get(self, request):
        scope = request.query_params.get("scope", "all")
        bookings = Booking.objects.filter(therapist=self.therapist).select_related("user")
        if scope == "upcoming":
            bookings = bookings.filter(status="confirmed")
        elif scope == "past":
            bookings = bookings.filter(status__in=["cancelled"])
        return Response(TherapistSessionSerializer(bookings, many=True).data)


class TherapistAvailabilityView(TherapistPortalMixin, APIView):
    def get(self, request):
        rules = self.therapist.availabilities.all()
        return Response(PortalAvailabilitySerializer(rules, many=True).data)

    def post(self, request):
        serializer = PortalAvailabilityWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rule = Availability.objects.create(
            therapist=self.therapist,
            weekday=serializer.validated_data["weekday"],
            start_time=serializer.validated_data["start_time"],
            end_time=serializer.validated_data["end_time"],
        )
        return Response(
            PortalAvailabilitySerializer(rule).data, status=status.HTTP_201_CREATED
        )


class TherapistAvailabilityDetailView(TherapistPortalMixin, APIView):
    def delete(self, request, pk):
        rule = get_object_or_404(Availability, pk=pk, therapist=self.therapist)
        rule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)