import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Cross-platform key/value storage.
 * Uses expo-secure-store on native and window.localStorage on web.
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const webStorage: StorageAdapter = {
  async getItem(key) {
    if (typeof globalThis.localStorage === "undefined") return null;
    return globalThis.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof globalThis.localStorage === "undefined") return;
    globalThis.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (typeof globalThis.localStorage === "undefined") return;
    globalThis.localStorage.removeItem(key);
  },
};

const nativeStorage: StorageAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const storage: StorageAdapter = Platform.OS === "web" ? webStorage : nativeStorage;

export const STORAGE_KEYS = {
  accessToken: "mindease.accessToken",
  refreshToken: "mindease.refreshToken",
  user: "mindease.user",
  language: "mindease.language",
  onboardingComplete: "mindease.onboardingComplete",
} as const;