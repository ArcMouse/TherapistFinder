/**
 * Timezone catalogue for client-facing displays.
 *
 * MindEase is an international product that targets India for regulatory
 * reasons, so onboarding only offers India as a country — but a client can be
 * anywhere in the world and sees every time in their own zone. The therapist
 * portal always shows IST.
 */

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time", abbr: "IST" },
  { value: "Asia/Dubai", label: "Gulf Standard Time", abbr: "GST" },
  { value: "Asia/Singapore", label: "Singapore Time", abbr: "SGT" },
  { value: "Asia/Tokyo", label: "Japan Standard Time", abbr: "JST" },
  { value: "Australia/Sydney", label: "Australian Eastern Time", abbr: "AET" },
  { value: "Europe/London", label: "British Time", abbr: "GMT/BST" },
  { value: "Europe/Berlin", label: "Central European Time", abbr: "CET" },
  { value: "America/New_York", label: "US Eastern Time", abbr: "ET" },
  { value: "America/Chicago", label: "US Central Time", abbr: "CT" },
  { value: "America/Los_Angeles", label: "US Pacific Time", abbr: "PT" },
  { value: "UTC", label: "Coordinated Universal Time", abbr: "UTC" },
] as const;

export type TimezoneValue = (typeof TIMEZONES)[number]["value"];

export function labelForTimezone(value: string | undefined): string {
  const found = TIMEZONES.find((zone) => zone.value === value);
  return found ? `${found.label} (${found.abbr})` : value ?? DEFAULT_TIMEZONE;
}

export function abbreviationForTimezone(value: string | undefined): string {
  const found = TIMEZONES.find((zone) => zone.value === value);
  return found?.abbr ?? "";
}