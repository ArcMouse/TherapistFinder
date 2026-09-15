# MindEase — Test Report

Generated: 2026-09-15T05:48:29.448Z

## Summary

| Suite | Command | Result |
|---|---|---|
| Backend (42 tests) | `python manage.py test` | **OK — 42 passed** |
| Mobile unit (32 tests) | `npm test -- --ci` | **32 passed, 0 failed** |
| Mobile E2E (36 steps) | `node e2e/run.mjs` | **36 passed, 0 failed** |
| Website E2E (25 steps) | `node e2e/web.mjs` | **25 passed, 0 failed** |

Zero unexpected console errors and zero page errors in both browser runs.

## Backend — `python manage.py test`

| Test | Result |
|---|---|
| `accounts.tests.AuthTests.test_google_endpoint_creates_user_on_valid_token` | OK |
| `accounts.tests.AuthTests.test_google_endpoint_rejects_invalid_id_token` | OK |
| `accounts.tests.AuthTests.test_login_rejects_invalid_credentials` | OK |
| `accounts.tests.AuthTests.test_login_returns_tokens_for_valid_credentials` | OK |
| `accounts.tests.AuthTests.test_me_patch_updates_onboarding_fields` | OK |
| `accounts.tests.AuthTests.test_password_reset_returns_202` | OK |
| `accounts.tests.AuthTests.test_protected_endpoint_accepts_valid_token` | OK |
| `accounts.tests.AuthTests.test_protected_endpoint_requires_token` | OK |
| `accounts.tests.AuthTests.test_register_creates_user_and_returns_tokens` | OK |
| `accounts.tests.AuthTests.test_register_rejects_duplicate_email` | OK |
| `bookings.tests.BookingApiTests.test_list_returns_only_own_bookings` | OK |
| `bookings.tests.BookingApiTests.test_post_bookings_requires_auth` | OK |
| `bookings.tests.BookingApiTests.test_post_bookings_returns_201_and_payload` | OK |
| `bookings.tests.BookingApiTests.test_post_bookings_returns_409_on_conflict` | OK |
| `bookings.tests.BookingServiceTests.test_book_session_creates_booking_and_blocks_slot` | OK |
| `bookings.tests.BookingServiceTests.test_book_session_raises_on_overlapping_slot` | OK |
| `bookings.tests.BookingServiceTests.test_book_session_raises_on_past_slot` | OK |
| `bookings.tests.CancelBookingTests.test_cancel_frees_slot` | OK |
| `bookings.tests.SessionReminderTests.test_cancelled_sessions_are_not_reminded` | OK |
| `bookings.tests.SessionReminderTests.test_management_command_sends_and_reports` | OK |
| `bookings.tests.SessionReminderTests.test_reminder_is_idempotent` | OK |
| `bookings.tests.SessionReminderTests.test_reminder_is_not_sent_too_early` | OK |
| `bookings.tests.SessionReminderTests.test_reminder_is_sent_within_the_window` | OK |
| `therapists.tests.AvailabilityFilterTests.test_utc_z_window_matches_the_intended_local_day` | OK |
| `therapists.tests.AvailabilityFilterTests.test_window_without_availability_excludes_therapist` | OK |
| `therapists.tests.AvailabilityTests.test_booked_slots_are_excluded` | OK |
| `therapists.tests.AvailabilityTests.test_filter_by_week_and_weekday` | OK |
| `therapists.tests.TherapistDetailTests.test_detail_returns_bio_tags_and_availability` | OK |
| `therapists.tests.TherapistListTests.test_list_requires_auth` | OK |
| `therapists.tests.TherapistListTests.test_list_serializes_top_two_tags_and_price` | OK |
| `therapists.tests.TherapistListTests.test_price_filter` | OK |
| `therapists.tests.TherapistListTests.test_returns_only_active_therapists` | OK |
| `therapists.tests.TherapistPortalTests.test_availability_create_and_delete` | OK |
| `therapists.tests.TherapistPortalTests.test_availability_rejects_inverted_range` | OK |
| `therapists.tests.TherapistPortalTests.test_non_therapist_is_forbidden` | OK |
| `therapists.tests.TherapistPortalTests.test_portal_only_exposes_own_sessions` | OK |
| `therapists.tests.TherapistPortalTests.test_portal_requires_authentication` | OK |
| `therapists.tests.TherapistPortalTests.test_sessions_list_shows_ist_times_and_zoom_links` | OK |
| `therapists.tests.TherapistPortalTests.test_therapist_can_login_and_fetch_profile_with_credits` | OK |
| `therapists.tests.VectorSearchTests.test_natural_language_query_returns_relevant_therapist` | OK |
| `therapists.tests.VectorSearchTests.test_search_endpoint_requires_auth` | OK |
| `therapists.tests.VectorSearchTests.test_search_with_time_expression_returns_available_therapist` | OK |

## Mobile unit — `npm test -- --ci`

| Test | Result |
|---|---|
| `__tests__/therapists.test.tsx` · renders therapist cards from the mocked API | PASS |
| `__tests__/therapists.test.tsx` · navigates to the therapist detail screen when a card is pressed | PASS |
| `__tests__/therapists.test.tsx` · triggers /api/search/ from the natural-language search bar | PASS |
| `__tests__/therapists.test.tsx` · renders name, degree, bio, tags, price and availability grid | PASS |
| `__tests__/therapists.test.tsx` · navigates to booking confirmation from the CTA | PASS |
| `__tests__/timezone.test.tsx` · renders the same instant differently per timezone | PASS |
| `__tests__/timezone.test.tsx` · includes the weekday and date in the target timezone | PASS |
| `__tests__/timezone.test.tsx` · can cross a calendar day when converting timezones | PASS |
| `__tests__/timezone.test.tsx` · persists the chosen timezone to the API and the session | PASS |
| `__tests__/timezone.test.tsx` · shows the current timezone label | PASS |
| `__tests__/booking.test.tsx` · posts the booking and navigates to My Bookings | PASS |
| `__tests__/booking.test.tsx` · surfaces a conflict error when the slot is taken | PASS |
| `__tests__/booking.test.tsx` · lists the user's bookings | PASS |
| `__tests__/booking.test.tsx` · cancels a booking | PASS |
| `__tests__/auth.test.tsx` · renders both Google and Email buttons | PASS |
| `__tests__/auth.test.tsx` · navigates to the email screen | PASS |
| `__tests__/auth.test.tsx` · calls /api/auth/google/ with the mocked ID token and stores the session | PASS |
| `__tests__/auth.test.tsx` · signs in via /api/auth/login/ and stores the token | PASS |
| `__tests__/auth.test.tsx` · registers new accounts and routes to onboarding | PASS |
| `__tests__/auth.test.tsx` · shows the Google-account error returned by the API | PASS |
| `__tests__/onboarding.test.tsx` · persists the selected language and continues to location | PASS |
| `__tests__/onboarding.test.tsx` · persists country + onboarded flag and finishes setup | PASS |
| `__tests__/onboarding.test.tsx` · only exposes India as a country option | PASS |
| `__tests__/routing.test.tsx` · waits until the session is hydrated | PASS |
| `__tests__/routing.test.tsx` · sends unauthenticated users to the auth screen | PASS |
| `__tests__/routing.test.tsx` · keeps unauthenticated users on the auth screen | PASS |
| `__tests__/routing.test.tsx` · sends authenticated but un-onboarded users to onboarding | PASS |
| `__tests__/routing.test.tsx` · sends onboarded users to the tabs | PASS |
| `__tests__/routing.test.tsx` · does not redirect onboarded users already in the tabs | PASS |
| `__tests__/routing.test.tsx` · hands off from the root gate to the tabs once onboarded | PASS |
| `__tests__/routing.test.tsx` · renders its label | PASS |
| `__tests__/routing.test.tsx` · renders a view with nativewind className | PASS |

## Mobile E2E — `node e2e/run.mjs`

| Test | Result |
|---|---|
| unauthenticated visit redirects to /auth | PASS |
| Google button visible | PASS |
| Email button visible | PASS |
| Terms link visible | PASS |
| navigated to /auth/email | PASS |
| signup redirects to /onboarding/language | PASS |
| English option is selected | PASS |
| other languages are disabled scaffolding | PASS |
| India is the only country option | PASS |
| therapist list renders ≥1 card (found 8) | PASS |
| Tomorrow filter shows 2 therapist(s) | PASS |
| This weekend filter shows 2 therapist(s) | PASS |
| toggling the filter off restores all therapists | PASS |
| search called /api/search/ | PASS |
| search results label rendered | PASS |
| search returns results (3) | PASS |
| first search result matches the first card | PASS |
| detail shows the searched therapist name | PASS |
| detail shows degree | PASS |
| detail shows bio | PASS |
| detail shows tags (anxiety) | PASS |
| detail shows pricing | PASS |
| detail shows availability grid | PASS |
| picked a free slot | PASS |
| POST /api/bookings/ returned 201 | PASS |
| navigated to My Bookings | PASS |
| booking appears in My Bookings | PASS |
| previously booked slot is now disabled | PASS |
| booking persists after reload | PASS |
| bookings default to the profile timezone (IST) | PASS |
| timezone selector shows the new zone | PASS |
| booking time is redisplayed in the user's timezone (ET) | PASS |
| profile shows account email | PASS |
| logout redirects to /auth | PASS |
| session cleared (auth buttons shown again) | PASS |
| Google button calls /api/auth/google/ | PASS |

## Website E2E — `node e2e/web.mjs`

| Test | Result |
|---|---|
| hero headline visible | PASS |
| value proposition visible | PASS |
| features section present | PASS |
| therapist section present | PASS |
| pricing section present | PASS |
| therapist login link in nav | PASS |
| therapist can authenticate | PASS |
| therapist profile exposes credits | PASS |
| client account created | PASS |
| booking created with a Zoom link | PASS |
| first run reports 1 reminder sent | PASS |
| an email file was written | PASS |
| second run is idempotent (0 sent) | PASS |
| login page rendered | PASS |
| invalid credentials show an error | PASS |
| IST badge shown | PASS |
| practice credits displayed | PASS |
| the booked session appears | PASS |
| session time is labelled IST | PASS |
| Zoom link is present and correct | PASS |
| reminder shows as sent | PASS |
| new availability rule appears | PASS |
| invalid range is rejected client-side | PASS |
| availability rule removed | PASS |
| non-therapist sees a clear message | PASS |

## Regression fixed in this run

Selecting a date filter showed **no available therapists**. The client sends an
end-of-local-day window as a UTC ISO string (`...Z`), and the backend derived the
calendar day from the UTC date, so a window starting 00:00 IST resolved to the
previous day and every real slot fell outside the range.

`therapists/views.py::_filter_by_availability` now derives the calendar days in
the server timezone (IST) and compares slots as instants.
`AvailabilityFilterTests` locks this in, and the mobile E2E now exercises the
Tomorrow / This weekend filters end to end.

## Reminder-email evidence (website E2E)

- A booking is created ~25 minutes in the future via `POST /api/bookings/`.
- `python manage.py send_session_reminders` writes one email containing the Zoom link and an IST timestamp.
- A second run sends `0` (idempotent).
- The portal shows the session with the Zoom link and `Email sent ✓`.

## Captured artifacts

### Mobile app — `e2e/screenshots/`

- `01-auth.png` — Auth choice
- `02-email.png` — Email sign in / sign up
- `03-onboarding-language.png` — Onboarding — language
- `04-onboarding-location.png` — Onboarding — location
- `05-therapist-list.png` — Therapist list
- `06-search-results.png` — Natural-language search
- `06b-date-filter.png` — Date availability filter
- `07-therapist-detail.png` — Therapist detail
- `08-booking-confirm.png` — Booking confirmation
- `09-my-bookings.png` — My bookings
- `10-booked-slot-greyed.png` — Booked slot greyed out
- `11-after-logout.png` — After logout
- `12-google-verification.png` — Google verification
- `13-timezone-selector.png` — Timezone selector
- `14-bookings-user-timezone.png` — Bookings in user timezone

### Website + portal — `e2e/screenshots/`

- `web-01-landing.png` — Marketing landing page
- `web-02-portal-login.png` — Therapist portal login
- `web-03-portal-dashboard.png` — Therapist dashboard
- `web-04-portal-availability.png` — Availability editor
- `web-05-non-therapist.png` — Non-therapist rejection
