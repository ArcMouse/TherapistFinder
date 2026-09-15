import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import { useAuth } from "../store/auth";

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 25000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = useAuth.getState().refreshToken;
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
    const access = data.access as string;
    const nextRefresh = (data.refresh as string | undefined) ?? refresh;
    await useAuth.getState().setTokens(access, nextRefresh);
    return access;
  } catch {
    await useAuth.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    const isAuthEndpoint = url.includes("/auth/");

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      refreshInFlight = refreshInFlight ?? refreshAccessToken();
      const token = await refreshInFlight;
      refreshInFlight = null;
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