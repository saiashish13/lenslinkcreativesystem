// Shared types + constants for creator listings (the real-data replacement
// for the deleted seed-data professionals module).

export type ListingCategory = "photographer" | "videographer" | "editor";
export type ListingSource = "self_serve" | "google_places" | "claimed";
export type VerificationStatus = "unverified" | "email_verified" | "id_verified" | "business_verified";

export interface Listing {
  id: string;
  slug: string;
  source: ListingSource;
  owner_user_id: string | null;
  google_place_id: string | null;
  business_name: string;
  display_name: string | null;
  tagline: string | null;
  bio: string | null;
  categories: string[];
  specialties: string[];
  city: string | null;
  state: string | null;
  country: string | null;
  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  cover_url: string | null;
  avatar_url: string | null;
  min_price_inr: number | null;
  max_price_inr: number | null;
  response_time_hours: number | null;
  places_rating: number | null;
  places_review_count: number | null;
  places_last_synced_at: string | null;
  verification_status: VerificationStatus;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const PHOTOGRAPHER_SPECIALTIES = [
  "Wedding", "Pre-wedding", "Fashion", "Portrait", "Product",
  "Commercial", "Wildlife", "Travel", "Event", "Real estate", "Food",
] as const;

export const VIDEOGRAPHER_SPECIALTIES = [
  "Wedding", "Event", "Corporate", "Documentary", "YouTube", "Commercial", "Drone",
] as const;

export const EDITOR_SPECIALTIES = [
  "Photo editing", "Lightroom", "Photoshop", "Retouching",
  "Video editing", "Color grading", "Motion graphics",
] as const;

export const BUDGET_BANDS = [
  { id: "u1k",   label: "Under ₹1,000",     min: 0,      max: 1_000 },
  { id: "1to5",  label: "₹1,000 – ₹5,000",  min: 1_000,  max: 5_000 },
  { id: "5to10", label: "₹5,000 – ₹10,000", min: 5_000,  max: 10_000 },
  { id: "10to25",label: "₹10,000 – ₹25,000",min: 10_000, max: 25_000 },
  { id: "25plus",label: "₹25,000+",         min: 25_000, max: 10_000_000 },
] as const;

export type BudgetBandId = (typeof BUDGET_BANDS)[number]["id"];

export const SORT_OPTIONS = [
  { id: "price_asc",    label: "Most affordable" },
  { id: "rating_desc",  label: "Highest rated" },
  { id: "reviews_desc", label: "Most reviewed" },
  { id: "distance_asc", label: "Closest" },
  { id: "response_asc", label: "Fastest response" },
] as const;

export type SortId = (typeof SORT_OPTIONS)[number]["id"];

export function categoryLabel(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

// Haversine — distance in km between two coords. Used for client-side sort
// when the user grants geolocation.
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}