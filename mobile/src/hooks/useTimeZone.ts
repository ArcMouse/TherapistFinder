import { DEFAULT_TIMEZONE } from "../lib/timezones";
import { useAuth } from "../store/auth";

/** The client's chosen IANA timezone (falls back to IST). */
export function useTimeZone(): string {
  return useAuth((state) => state.user?.profile?.preferred_timezone) || DEFAULT_TIMEZONE;
}