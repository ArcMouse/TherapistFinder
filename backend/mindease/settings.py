"""
Django settings for the MindEase backend.

Configuration is environment driven. A local SQLite database is used by
default so that `python manage.py test` and local development work with zero
setup. Point `DATABASE_URL` at PostgreSQL (with the `pgvector` extension) to
run in production mode with true vector search.
"""

import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent

# Load backend/.env first, then a repo-root .env as a fallback.
load_dotenv(BASE_DIR / ".env")
load_dotenv(REPO_ROOT / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


SECRET_KEY = os.environ.get("SECRET_KEY", "dev-insecure-change-me-in-production")
DEBUG = env_bool("DEBUG", True)
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "*") or ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "accounts",
    "therapists",
    "bookings",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "mindease.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "mindease.wsgi.application"
ASGI_APPLICATION = "mindease.asgi.application"


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
def build_database_config() -> dict:
    url = os.environ.get("DATABASE_URL", "").strip()
    if url:
        parsed = urlparse(url)
        if parsed.scheme.startswith("postgres"):
            return {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": parsed.path.lstrip("/") or "mindease",
                "USER": parsed.username or "",
                "PASSWORD": parsed.password or "",
                "HOST": parsed.hostname or "localhost",
                "PORT": str(parsed.port or 5432),
                "CONN_MAX_AGE": 60,
            }
    return {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.environ.get("SQLITE_PATH", str(BASE_DIR / "db.sqlite3")),
    }


DATABASES = {"default": build_database_config()}
IS_POSTGRES = DATABASES["default"]["ENGINE"].endswith("postgresql")


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ---------------------------------------------------------------------------
# Django REST Framework / JWT
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "DEFAULT_PAGINATION_CLASS": None,
    "EXCEPTION_HANDLER": "mindease.exceptions.mindease_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.environ.get("JWT_ACCESS_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.environ.get("JWT_REFRESH_DAYS", "14"))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "SIGNING_KEY": os.environ.get("JWT_SIGNING_KEY", SECRET_KEY),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}


# ---------------------------------------------------------------------------
# CORS (Expo web / native dev clients)
# ---------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL_ORIGINS", True)
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True


# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")


# ---------------------------------------------------------------------------
# Zoom (placeholder integration point; no live calls are made)
# ---------------------------------------------------------------------------
ZOOM_SDK_KEY = os.environ.get("ZOOM_SDK_KEY", "")
ZOOM_SDK_SECRET = os.environ.get("ZOOM_SDK_SECRET", "")


# ---------------------------------------------------------------------------
# Email (session reminders)
# ---------------------------------------------------------------------------
# Dev default prints emails to the server console. Set
# EMAIL_BACKEND=django.core.mail.backends.filebased.EmailBackend to capture
# them as .eml files (used by the E2E harness), or an SMTP backend in prod.
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)
EMAIL_FILE_PATH = os.environ.get("EMAIL_FILE_PATH", str(BASE_DIR / "emails"))
DEFAULT_FROM_EMAIL = os.environ.get(
    "DEFAULT_FROM_EMAIL", "MindEase <no-reply@mindease.test>"
)
SESSION_REMINDER_MINUTES = int(os.environ.get("SESSION_REMINDER_MINUTES", "30"))


# ---------------------------------------------------------------------------
# Embeddings / vector search
# ---------------------------------------------------------------------------
EMBEDDING_MODEL_NAME = os.environ.get(
    "EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"
)
EMBEDDING_DIMENSIONS = 384

# File logging so that the dev server output can be inspected during E2E runs.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "[{asctime}] {levelname} {name}: {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
    },
    "root": {"handlers": ["console"], "level": os.environ.get("LOG_LEVEL", "INFO")},
}
