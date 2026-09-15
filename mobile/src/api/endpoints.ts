import { api } from "./client";
import type {
  AuthResponse,
  Availability,
  Booking,
  SearchResponse,
  Slot,
  Therapist,
  User,
} from "../types";

export const authApi = {
  register: (payload: {
    email: string;
    password: string;
    password_confirm: string;
    name?: string;
  }): Promise<AuthResponse> =>
    api.post<AuthResponse>("/auth/register/", payload).then((r) => r.data),

  login: (payload: { email: string; password: string }): Promise<AuthResponse> =>
    api.post<AuthResponse>("/auth/login/", payload).then((r) => r.data),

  google: (idToken: string): Promise<AuthResponse> =>
    api.post<AuthResponse>("/auth/google/", { id_token: idToken }).then((r) => r.data),

  logout: (refresh: string): Promise<void> =>
    api.post("/auth/logout/", { refresh }).then(() => undefined),

  passwordReset: (email: string): Promise<{ detail: string }> =>
    api.post("/auth/password-reset/", { email }).then((r) => r.data),
};

export const meApi = {
  get: (): Promise<User> => api.get<User>("/me/").then((r) => r.data),
  update: (patch: Partial<User["profile"]>): Promise<User> =>
    api.patch<User>("/me/", patch).then((r) => r.data),
};

export const therapistApi = {
  list: (params: Record<string, string | number | undefined> = {}): Promise<Therapist[]> =>
    api.get<Therapist[]>("/therapists/", { params }).then((r) => r.data),

  search: (query: string): Promise<SearchResponse> =>
    api.get<SearchResponse>("/search/", { params: { q: query } }).then((r) => r.data),

  detail: (id: number | string): Promise<Therapist> =>
    api.get<Therapist>(`/therapists/${id}/`).then((r) => r.data),

  availability: (
    id: number | string,
    week?: string
  ): Promise<{
    therapist_id: number;
    week: string | null;
    session_duration_min: number;
    slots: Slot[];
  }> =>
    api
      .get(`/therapists/${id}/availability/`, { params: week ? { week } : {} })
      .then((r) => r.data),
};

export const bookingApi = {
  list: (): Promise<Booking[]> => api.get<Booking[]>("/bookings/").then((r) => r.data),

  create: (therapist: number, startDt: string): Promise<Booking> =>
    api
      .post<Booking>("/bookings/", { therapist, start_dt: startDt })
      .then((r) => r.data),

  cancel: (id: number): Promise<Booking> =>
    api.delete<Booking>(`/bookings/${id}/`).then((r) => r.data),
};

export type { Availability };