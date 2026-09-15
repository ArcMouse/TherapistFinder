import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { STORAGE_KEYS } from "../lib/storage";

interface OnboardingState {
  language: string;
  country: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  setCountry: (country: string) => Promise<void>;
}

export const useOnboarding = create<OnboardingState>((set) => ({
  language: "en",
  country: "IN",
  hydrated: false,

  hydrate: async () => {
    const [language, country] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.language),
      AsyncStorage.getItem("mindease.country"),
    ]);
    set({
      language: language ?? "en",
      country: country ?? "IN",
      hydrated: true,
    });
  },

  setLanguage: async (language) => {
    await AsyncStorage.setItem(STORAGE_KEYS.language, language);
    set({ language });
  },

  setCountry: async (country) => {
    await AsyncStorage.setItem("mindease.country", country);
    set({ country });
  },
}));

export const LANGUAGES = [
  { code: "en", label: "English", native: "English", enabled: true },
  { code: "hi", label: "Hindi", native: "हिन्दी", enabled: false },
  { code: "ta", label: "Tamil", native: "தமிழ்", enabled: false },
] as const;

export const COUNTRIES = [{ code: "IN", label: "India", flag: "🇮🇳" }] as const;