# MindEase — Backend (Django + DRF)

Therapist discovery, natural-language (vector) search and Zoom session booking.

## Stack

- Django 5.2 + Django REST Framework
- `djangorestframework-simplejwt` for JWT access/refresh tokens
- `google-auth` for Google ID-token verification
- `sentence-transformers` (`all-MiniLM-L6-v2`, 384-d) for embeddings
- PostgreSQL + `pgvector` in production; SQLite for zero-setup dev/tests
- `dateparser` for natural-language time expressions ("Sunday evening")

## Quick start

```sh
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp ../.env.example .env          # optional; sensible defaults work without it
python manage.py migrate
python manage.py seed_therapists # 8 realistic therapists + weekly availability
python manage.py runserver 0.0.0.0:8000
```

Alternatively load the checked-in fixture:

```sh
python manage.py loaddata fixtures/seed_therapists.json
```

Embeddings are generated automatically whenever a `Therapist` is created or
updated (see `therapists/signals.py`). If the ML stack/model is unavailable the
signal is a no-op and search falls back to keyword/full-text search.

## Tests

```sh
python manage.py test
```

All tests run against SQLite in-memory. The vector-search test skips gracefully
when `sentence-transformers` or the model weights are unavailable, and runs for
real when they are.

## Database portability

`mindease/fields.py` provides backend-aware fields so the same models run in
both environments:

| Model field | PostgreSQL | Other backends |
|---|---|---|
| `Therapist.embedding` (`VectorField`) | `pgvector` `vector(384)` + `<=>` cosine distance | JSON text + Python cosine |
| `Therapist.tags` (`TagsField`) | `ArrayField(CharField)` | `JSONField` |

To run against PostgreSQL:

```sh
psql -c 'CREATE EXTENSION IF NOT EXISTS vector;'
export DATABASE_URL=postgres://user:pass@localhost:5432/mindease
python manage.py makemigrations && python manage.py migrate
```

## API

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register/` | public | Email + password signup → JWT pair |
| POST | `/api/auth/login/` | public | Email + password login → JWT pair |
| POST | `/api/auth/google/` | public | `{ id_token }` → verify with Google → JWT pair |
| POST | `/api/auth/refresh/` | public | Refresh access token |
| POST | `/api/auth/logout/` | required | Blacklist refresh token |
| POST | `/api/auth/password-reset/` | public | Stub — 202, no email sent |
| GET | `/api/me/` | required | Current user + profile |
| PATCH | `/api/me/` | required | Update language, country, onboarded |
| GET | `/api/therapists/` | required | List + filter (`q`, `tags`, `max_price`, `available_from/to`) |
| GET | `/api/therapists/{id}/` | required | Detail |
| GET | `/api/therapists/{id}/availability/?week=YYYY-WW` | required | Weekly slots (booked flagged) |
| POST | `/api/bookings/` | required | Calls `book_session()` |
| DELETE | `/api/bookings/{id}/` | required | Cancel — releases the slot |
| GET | `/api/search/?q=...` | required | Vector search over name/degree/bio/tags |

### Therapist portal (therapist accounts only)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/therapist/me/` | Profile + demo `credits` (403 for non-therapists) |
| GET | `/api/therapist/sessions/` | Own sessions with client info, IST times and Zoom links |
| GET | `/api/therapist/availability/` | Published weekly availability rules |
| POST | `/api/therapist/availability/` | Add a rule (`weekday`, `start_time`, `end_time`) |
| DELETE | `/api/therapist/availability/{id}/` | Remove a rule |

All portal responses render times in **IST** (`start_dt_ist`, `reminder_at_ist`),
independent of the client-facing timezone handling. Seeded therapists get a demo
password (`SEED_THERAPIST_PASSWORD`, default `TherapistPass123`) so they can sign in.

### Session reminders

`bookings/reminders.py::send_due_reminders()` emails the Zoom link for confirmed
sessions starting within `SESSION_REMINDER_MINUTES` (default 30). It is idempotent
(`Booking.reminder_sent_at`) and exposed via the management command:

```sh
python manage.py send_session_reminders          # one pass
python manage.py send_session_reminders --loop   # poll every 60s
```

## The booking service

`bookings/services.py` exposes a single function, `book_session()`. It is fully
functional today and contains the one and only payment integration point — an
empty, clearly-marked block where payment/credits will later live. No payment
provider classes, stubs or sample code exist anywhere in the project.

## Layout

```
mindease/        settings, urls, portable fields, embeddings, exception mapping
accounts/        UserProfile, email + Google auth views, /me
therapists/      Therapist, Availability, weekly slots, vector search, seed command
bookings/        Booking, BookedSlot, services.book_session(), REST endpoints
fixtures/        seed_therapists.json
```
