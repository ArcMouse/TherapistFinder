"""Seed the database with realistic sample therapists and availability.

    python manage.py seed_therapists
    python manage.py seed_therapists --flush
"""

import os
from datetime import time

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from therapists.models import Availability, Therapist

User = get_user_model()

DEMO_THERAPIST_PASSWORD = os.environ.get(
    "SEED_THERAPIST_PASSWORD", "TherapistPass123"
)

THERAPISTS = [
    {
        "email": "ananya.iyer@mindease.test",
        "name": "Dr. Ananya Iyer",
        "degree": "M.Phil Clinical Psychology",
        "experience_years": 12,
        "bio": (
            "Anxiety and adolescent specialist. I blend cognitive behavioural therapy "
            "with mindfulness to help teenagers and young adults manage panic, worry "
            "and exam stress. Sessions are warm, structured and judgement free."
        ),
        "tags": ["anxiety", "teens", "cbt"],
        "session_price_inr": 1500,
        "session_duration_min": 50,
        "rating": 4.9,
        "credits": 18,
        "photo_url": "https://i.pravatar.cc/300?img=47",
        "availability": [(6, time(17, 0), time(21, 0)), (0, time(10, 0), time(13, 0))],
    },
    {
        "email": "rohan.mehta@mindease.test",
        "name": "Rohan Mehta",
        "degree": "M.A. Counselling Psychology",
        "experience_years": 8,
        "bio": (
            "I work with couples and individuals navigating relationship conflict, "
            "communication breakdowns and work-related stress. My approach is "
            "emotionally focused and practical, with clear tools you can use at home."
        ),
        "tags": ["relationships", "couples", "stress"],
        "session_price_inr": 1200,
        "session_duration_min": 50,
        "rating": 4.7,
        "credits": 12,
        "photo_url": "https://i.pravatar.cc/300?img=12",
        "availability": [(2, time(18, 0), time(21, 0)), (5, time(10, 0), time(14, 0))],
    },
    {
        "email": "priya.nair@mindease.test",
        "name": "Dr. Priya Nair",
        "degree": "Ph.D. Clinical Psychology",
        "experience_years": 15,
        "bio": (
            "Trauma-informed therapist trained in EMDR. I support adults recovering "
            "from depression, grief and past trauma, and I help clients rebuild a "
            "sense of safety and self-trust at their own pace."
        ),
        "tags": ["depression", "trauma", "emdr"],
        "session_price_inr": 2200,
        "session_duration_min": 60,
        "rating": 4.8,
        "credits": 24,
        "photo_url": "https://i.pravatar.cc/300?img=32",
        "availability": [(6, time(9, 0), time(13, 0)), (1, time(17, 0), time(20, 0))],
    },
    {
        "email": "arjun.deshpande@mindease.test",
        "name": "Arjun Deshpande",
        "degree": "M.Sc. Clinical Psychology",
        "experience_years": 6,
        "bio": (
            "ADHD and academic-stress coach for students and young professionals. "
            "I teach executive-function strategies, focus routines and self-compassion "
            "so that attention difficulties stop running your life."
        ),
        "tags": ["adhd", "teens", "academic stress"],
        "session_price_inr": 1000,
        "session_duration_min": 45,
        "rating": 4.6,
        "credits": 8,
        "photo_url": "https://i.pravatar.cc/300?img=15",
        "availability": [(6, time(18, 0), time(22, 0)), (3, time(16, 0), time(20, 0))],
    },
    {
        "email": "meera.krishnan@mindease.test",
        "name": "Dr. Meera Krishnan",
        "degree": "MD Psychiatry",
        "experience_years": 20,
        "bio": (
            "Consultant psychiatrist offering medication review alongside therapy for "
            "bipolar disorder, severe anxiety and sleep problems. I coordinate closely "
            "with psychologists for integrated, whole-person care."
        ),
        "tags": ["bipolar", "medication", "anxiety"],
        "session_price_inr": 3000,
        "session_duration_min": 40,
        "rating": 4.9,
        "credits": 30,
        "photo_url": "https://i.pravatar.cc/300?img=45",
        "availability": [(0, time(18, 0), time(21, 0)), (4, time(10, 0), time(13, 0))],
    },
    {
        "email": "kavya.rao@mindease.test",
        "name": "Kavya Rao",
        "degree": "RCI Licensed Counsellor",
        "experience_years": 5,
        "bio": (
            "Compassion-focused counsellor helping people through grief, low "
            "self-esteem and burnout. I weave mindfulness and value-based goal "
            "setting into every session so change feels sustainable."
        ),
        "tags": ["grief", "self-esteem", "mindfulness"],
        "session_price_inr": 900,
        "session_duration_min": 50,
        "rating": 4.5,
        "credits": 6,
        "photo_url": "https://i.pravatar.cc/300?img=25",
        "availability": [(6, time(17, 0), time(20, 0)), (5, time(15, 0), time(19, 0))],
    },
    {
        "email": "vikram.sharma@mindease.test",
        "name": "Dr. Vikram Sharma",
        "degree": "Ph.D. Psychology",
        "experience_years": 18,
        "bio": (
            "I specialise in addiction recovery and men's mental health, including "
            "anger, identity and fatherhood challenges. Recovery is built on "
            "accountability without shame, and family involvement where helpful."
        ),
        "tags": ["addiction", "men's mental health", "anger"],
        "session_price_inr": 2500,
        "session_duration_min": 60,
        "rating": 4.7,
        "credits": 15,
        "photo_url": "https://i.pravatar.cc/300?img=59",
        "availability": [(1, time(19, 0), time(22, 0)), (6, time(8, 0), time(12, 0))],
    },
    {
        "email": "sneha.pillai@mindease.test",
        "name": "Sneha Pillai",
        "degree": "M.Phil Clinical Psychology",
        "experience_years": 9,
        "bio": (
            "Child psychologist supporting autism, developmental delays and "
            "parenting stress. I use play-based and behavioural techniques, and I "
            "coach parents so progress continues between sessions."
        ),
        "tags": ["child psychology", "autism", "parenting"],
        "session_price_inr": 1400,
        "session_duration_min": 50,
        "rating": 4.8,
        "credits": 10,
        "photo_url": "https://i.pravatar.cc/300?img=44",
        "availability": [(6, time(10, 0), time(14, 0)), (2, time(16, 0), time(19, 0))],
    },
]


class Command(BaseCommand):
    help = "Seed sample therapists, users and weekly availability."

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true", help="Delete existing therapists first")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            Therapist.objects.all().delete()

        created_count = 0
        for data in THERAPISTS:
            user, created = User.objects.get_or_create(
                username=data["email"],
                defaults={"email": data["email"], "first_name": data["name"]},
            )
            # Demo therapist accounts get a known password so they can sign in to
            # the therapist portal. Override with SEED_THERAPIST_PASSWORD.
            user.set_password(DEMO_THERAPIST_PASSWORD)
            user.save(update_fields=["password"])

            therapist, created = Therapist.objects.update_or_create(
                user=user,
                defaults={
                    "name": data["name"],
                    "degree": data["degree"],
                    "experience_years": data["experience_years"],
                    "bio": data["bio"],
                    "tags": data["tags"],
                    "session_price_inr": data["session_price_inr"],
                    "session_duration_min": data["session_duration_min"],
                    "rating": data["rating"],
                    "photo_url": data["photo_url"],
                    "is_active": True,
                    "credits": data["credits"],
                },
            )
            therapist.availabilities.all().delete()
            for weekday, start, end in data["availability"]:
                Availability.objects.create(
                    therapist=therapist,
                    weekday=weekday,
                    start_time=start,
                    end_time=end,
                )
            created_count += 1
            self.stdout.write(f"  seeded {therapist.name}")

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {created_count} therapists with availability.")
        )