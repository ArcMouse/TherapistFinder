/** All therapist-portal times are rendered in IST (Asia/Kolkata). */
export const CLINICIAN_TIMEZONE = "Asia/Kolkata";
export const CLINICIAN_TZ_LABEL = "IST";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function weekdayLabel(index: number): string {
  return WEEKDAYS[index] ?? "";
}

function toDate(input: string | Date): Date | null {
  const date = typeof input === "string" ? new Date(input) : input;
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatIST(input: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const date = toDate(input);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: CLINICIAN_TIMEZONE,
    ...options,
  }).format(date);
}

export function formatDateIST(input: string | Date): string {
  return `${formatIST(input, { weekday: "short", day: "numeric", month: "short" })}`;
}

export function formatTimeIST(input: string | Date): string {
  return formatIST(input, { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDateTimeIST(input: string | Date): string {
  const date = toDate(input);
  if (!date) return "";
  return `${formatDateIST(date)} · ${formatTimeIST(date)} ${CLINICIAN_TZ_LABEL}`;
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

export function formatPriceINR(value: string | number): string {
  const numeric = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(numeric)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

export const WEEKDAY_OPTIONS = WEEKDAYS.map((label, index) => ({ label, index }));