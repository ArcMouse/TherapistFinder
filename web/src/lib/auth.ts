import { create } from "zustand";

const KEY_ACCESS = "mindease.portal.access";
const KEY_REFRESH = "mindease.portal.refresh";

interface PortalAuthState {
  access: string | null;
  refresh: string | null;
  hydrated: boolean;
  hydrate: () => void;
  setTokens: (access: string, refresh: string) => void;
  clear: () => void;
}

export const usePortalAuth = create<PortalAuthState>((set) => ({
  access: null,
  refresh: null,
  hydrated: false,

  hydrate: () => {
    set({
      access: localStorage.getItem(KEY_ACCESS),
      refresh: localStorage.getItem(KEY_REFRESH),
      hydrated: true,
    });
  },

  setTokens: (access, refresh) => {
    localStorage.setItem(KEY_ACCESS, access);
    localStorage.setItem(KEY_REFRESH, refresh);
    set({ access, refresh });
  },

  clear: () => {
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    set({ access: null, refresh: null });
  },
}));