export interface UserProfile {
  language: string;
  country: string;
  preferred_timezone: string;
  onboarded: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  profile: UserProfile;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Therapist {
  id: number;
  name: string;
  degree: string;
  experience_years: number;
  bio?: string;
  tags: string[];
  top_tags?: string[];
  session_price_inr: string | number;
  session_duration_min: number;
  photo_url: string;
  rating: string | number;
  next_available?: string | null;
  availability_badge?: "available" | "fully_booked";
  availabilities?: Availability[];
}

export interface Availability {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface Slot {
  start_dt: string;
  end_dt: string;
  booked: boolean;
}

export interface Booking {
  id: number;
  therapist: number;
  therapist_name: string;
  therapist_degree: string;
  therapist_photo_url: string;
  session_price_inr: string | number;
  start_dt: string;
  end_dt: string;
  status: "pending" | "confirmed" | "cancelled";
  zoom_link: string;
}

export interface SearchResponse {
  query: string;
  count: number;
  results: Therapist[];
}