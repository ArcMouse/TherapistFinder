"""Serializers for authentication and the current-user endpoints."""

from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["language", "country", "preferred_timezone", "onboarded"]


class MeSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "name", "profile"]

    def get_name(self, obj) -> str:
        return obj.get_full_name() or obj.first_name or obj.email.split("@")[0]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    name = serializers.CharField(required=False, allow_blank=True, max_length=150)

    def validate_email(self, value: str) -> str:
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        email = validated_data["email"]
        name = (validated_data.get("name") or "").strip()
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=name,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        user = authenticate(username=email, password=attrs["password"])
        if user is None:
            existing = User.objects.filter(email__iexact=email).first()
            if existing is not None and not existing.has_usable_password():
                raise serializers.ValidationError("Account uses Google sign-in.")
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")
        attrs["user"] = user
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["language", "country", "preferred_timezone", "onboarded"]
        extra_kwargs = {field: {"required": False} for field in fields}