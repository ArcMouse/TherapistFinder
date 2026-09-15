import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export async function renderWithProviders(ui: React.ReactElement) {
  const client = createTestQueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

export const therapistFixture = {
  id: 1,
  name: "Dr. Ananya Iyer",
  degree: "M.Phil Clinical Psychology",
  experience_years: 12,
  bio: "Anxiety and adolescent specialist using CBT and mindfulness.",
  tags: ["anxiety", "teens", "cbt"],
  top_tags: ["anxiety", "teens"],
  session_price_inr: "1500.00",
  session_duration_min: 50,
  photo_url: "https://example.com/photo.png",
  rating: "4.9",
  next_available: "2026-09-20T17:00:00+00:00",
  availability_badge: "available" as const,
  availabilities: [{ id: 1, weekday: 6, start_time: "17:00:00", end_time: "21:00:00" }],
};

export const bookingFixture = {
  id: 10,
  therapist: 1,
  therapist_name: "Dr. Ananya Iyer",
  therapist_degree: "M.Phil Clinical Psychology",
  therapist_photo_url: "https://example.com/photo.png",
  session_price_inr: "1500.00",
  start_dt: "2026-09-20T17:00:00+00:00",
  end_dt: "2026-09-20T17:50:00+00:00",
  status: "confirmed" as const,
  zoom_link: "https://zoom.us/j/10",
};

export const userFixture = {
  id: 1,
  email: "demo@mindease.test",
  name: "Demo User",
  profile: {
    language: "en",
    country: "IN",
    preferred_timezone: "Asia/Kolkata",
    onboarded: true,
  },
};

export const sessionFixture = {
  access: "access-token",
  refresh: "refresh-token",
  user: userFixture,
};

export const slotFixture = {
  start_dt: "2026-09-20T17:00:00+00:00",
  end_dt: "2026-09-20T17:50:00+00:00",
  booked: false,
};