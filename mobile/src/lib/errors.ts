import { AxiosError } from "axios";

type ErrorLike = {
  response?: { data?: unknown };
  code?: string;
  message?: string;
  isAxiosError?: boolean;
};

function firstMessage(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;

  for (const value of Object.values(record)) {
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    if (typeof value === "string") return value;
  }
  return null;
}

/** Pull the most useful message out of a DRF error response. */
export function extractApiError(error: unknown, fallback = "Something went wrong."): string {
  const like = error as ErrorLike;

  if (like?.response?.data !== undefined || like?.isAxiosError) {
    const message = firstMessage(like.response?.data);
    if (message) return message;
    if (like.code === "ECONNABORTED") return "Request timed out. Please try again.";
    if (!like.response) return "Cannot reach the server. Is the backend running?";
  }

  if (error instanceof AxiosError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}