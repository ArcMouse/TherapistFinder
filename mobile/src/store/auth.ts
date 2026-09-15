import { create } from "zustand";
import { storage, STORAGE_KEYS } from "../lib/storage";
import type { AuthResponse, User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (payload: AuthResponse) => Promise<void>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  clear: () => Promise<void>;
}

async function persistSession(token: string, refreshToken: string, user: User) {
  await storage.setItem(STORAGE_KEYS.accessToken, token);
  await storage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  await storage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const [token, refreshToken, rawUser] = await Promise.all([
        storage.getItem(STORAGE_KEYS.accessToken),
        storage.getItem(STORAGE_KEYS.refreshToken),
        storage.getItem(STORAGE_KEYS.user),
      ]);
      set({
        token,
        refreshToken,
        user: rawUser ? (JSON.parse(rawUser) as User) : null,
        hydrated: true,
      });
    } catch {
      set({ token: null, refreshToken: null, user: null, hydrated: true });
    }
  },

  setSession: async (payload) => {
    await persistSession(payload.access, payload.refresh, payload.user);
    set({ token: payload.access, refreshToken: payload.refresh, user: payload.user });
  },

  setTokens: async (access, refresh) => {
    await storage.setItem(STORAGE_KEYS.accessToken, access);
    await storage.setItem(STORAGE_KEYS.refreshToken, refresh);
    set({ token: access, refreshToken: refresh });
  },

  setUser: async (user) => {
    await storage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    set({ user });
  },

  clear: async () => {
    await Promise.all([
      storage.removeItem(STORAGE_KEYS.accessToken),
      storage.removeItem(STORAGE_KEYS.refreshToken),
      storage.removeItem(STORAGE_KEYS.user),
    ]);
    set({ token: null, refreshToken: null, user: null });
  },
}));

export function isAuthenticated(state: Pick<AuthState, "token" | "user">): boolean {
  return Boolean(state.token && state.user);
}