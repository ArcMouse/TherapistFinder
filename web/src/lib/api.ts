import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { usePortalAuth } from "./auth";

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 25000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const access = usePortalAuth.getState().access;
  if (access) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const { refresh } = usePortalAuth.getState();
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
    usePortalAuth.getState().setTokens(data.access, data.refresh ?? refresh);
    return data.access as string;
  } catch {
    usePortalAuth.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuth = (original?.url ?? "").includes("/auth/");
    if (error.response?.status === 401 && original && !original._retry && !isAuth) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccess();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers = {
          ...(original.headers as Record<string, string>),
          Authorization: `Bearer ${token}`,
        };
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export interface PortalUser {
  id: number;
  email: string;
  name: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: { id: number; email: string; name: string; profile: Record<string, unknown> };
}

export interface TherapistProfile {
  id: number;
  name: string;
  degree: string;
  experience_years: number;
  bio: string;
  tags: string[];
  session_price_inr: string | number;
  session_duration_min: number;
  rating: string | number;
  is_active: boolean;
  credits: number;
  timezone: string;
}

export interface TherapistSession {
  id: number;
  status: "pending" | "confirmed" | "cancelled";
  start_dt: string;
  end_dt: string;
  start_dt_ist: string;
  end_dt_ist: string;
  duration_min: number;
  client_name: string;
  client_email: string;
  zoom_link: string;
  reminder_sent_at: string | null;
  reminder_at_ist: string;
  is_upcoming: boolean;
}

export interface AvailabilityRule {
  id: number;
  weekday: number;
  weekday_label: string;
  start_time: string;
  end_time: string;
}

export const portalApi = {
  login: (email: string, password: string): Promise<LoginResponse> =>
    api.post<LoginResponse>("/auth/login/", { email, password }).then((r) => r.data),

  me: (): Promise<TherapistProfile> => api.get("/therapist/me/").then((r) => r.data),

  /** Verify an access token before it is stored in the auth store. */
  meWithToken: (access: string): Promise<TherapistProfile> =>
    axios
      .get(`${API_URL}/therapist/me/`, { headers: { Authorization: `Bearer ${access}` } })
      .then((r) => r.data),

  sessions: (): Promise<TherapistSession[]> =>
    api.get("/therapist/sessions/").then((r) => r.data),

  availability: (): Promise<AvailabilityRule[]> =>
    api.get("/therapist/availability/").then((r) => r.data),

  createAvailability: (payload: {
    weekday: number;
    start_time: string;
    end_time: string;
  }): Promise<AvailabilityRule> =>
    api.post("/therapist/availability/", payload).then((r) => r.data),

  deleteAvailability: (id: number): Promise<void> =>
    api.delete(`/therapist/availability/${id}/`).then(() => undefined),
};

export function extractApiError(error: unknown, fallback = "Something went wrong."): string {
  const like = error as {
    response?: { data?: unknown };
    code?: string;
    message?: string;
    isAxiosError?: boolean;
  };
  const data = like?.response?.data;
  if (data) {
    if (typeof data === "string") return data;
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    for (const value of Object.values(record)) {
      if (Array.isArray(value) && value.length > 0) return String(value[0]);
      if (typeof value === "string") return value;
    }
  }
  if (like?.code === "ECONNABORTED") return "Request timed out. Please try again.";
  if (error instanceof AxiosError && !error.response)
    return "Cannot reach the server. Is the backend running?";
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}