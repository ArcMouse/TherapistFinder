const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function toDate(input: string | Date): Date | null {
  const date = typeof input === "string" ? new Date(input) : input;
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPrice(value: string | number | undefined): string {
  const numeric = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0);
  if (Number.isNaN(numeric)) return "₹0";
  return INR.format(numeric);
}

export function formatRating(value: string | number | undefined): string {
  const numeric = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0);
  return numeric.toFixed(1);
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Weekday for a backend `Availability.weekday` (0 = Monday). */
export function weekdayShort(index: number): string {
  return WEEKDAYS[index] ?? "";
}

export function weekdayLong(index: number): string {
  return WEEKDAYS_LONG[index] ?? "";
}

/**
 * Format an instant in a specific IANA timezone. Defaults to the device
 * timezone when none is supplied.
 */
export function formatInZone(
  input: string | Date,
  timeZone?: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = toDate(input);
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", { ...options, timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-IN", options).format(date);
  }
}

export function formatDate(input: string | Date, timeZone?: string): string {
  return formatInZone(input, timeZone, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatTime(input: string | Date, timeZone?: string): string {
  return formatInZone(input, timeZone, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(input: string | Date, timeZone?: string): string {
  const date = toDate(input);
  if (!date) return "";
  return `${formatDate(date, timeZone)} · ${formatTime(date, timeZone)}`;
}

/** Stable `YYYY-MM-DD` day key for grouping instants by calendar day. */
export function dayKeyInZone(input: string | Date, timeZone?: string): string {
  return formatInZone(input, timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const SHORT_TO_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/** Weekday index (0 = Monday) of an instant as observed in `timeZone`. */
export function weekdayIndexInZone(input: string | Date, timeZone?: string): number {
  const date = toDate(input);
  if (!date) return 0;
  try {
    const short = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone,
    })
      .format(date)
      .slice(0, 3);
    return SHORT_TO_INDEX[short] ?? 0;
  } catch {
    return (date.getDay() + 6) % 7;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter((part) => part && !part.endsWith("."))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function isoWeekString(date: Date): string {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}

export function currentWeek(offsetWeeks = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetWeeks * 7);
  return isoWeekString(date);
}