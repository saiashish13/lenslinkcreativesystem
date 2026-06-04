// Geocode a free-text location (city, ZIP, address) to lat/lng using the
// Google Maps Geocoding API via the Lovable connector gateway. Used by the
// marketplace when the user denies browser geolocation and falls back to
// manual city/ZIP entry for radius filtering.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const Input = z.object({
  query: z.string().min(2).max(120),
  region: z.string().min(2).max(4).optional(),
});

interface GeocodeResponse {
  status?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    address_components?: Array<{ long_name?: string; types?: string[] }>;
  }>;
}

type AddressComponent = { long_name?: string; types?: string[] };
function part(components: AddressComponent[] | undefined, type: string): string | null {
  if (!components) return null;
  const c = components.find((x) => x.types?.includes(type));
  return c?.long_name ?? null;
}

export const geocodeLocation = createServerFn({ method: "POST" })
  .inputValidator((i) => Input.parse(i))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    const connKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || !connKey) throw new Error("Google Maps connector not configured");

    const params = new URLSearchParams({
      address: data.query,
      region: data.region ?? "in",
    });

    const res = await fetch(`${GATEWAY_URL}/maps/api/geocode/json?${params}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Connection-Api-Key": connKey,
      },
    });
    if (!res.ok) throw new Error(`Geocode failed (${res.status})`);
    const json = (await res.json()) as GeocodeResponse;
    if (json.status !== "OK" || !json.results?.length) {
      throw new Error("Couldn't find that location. Try a different city or ZIP.");
    }
    const top = json.results[0];
    const loc = top.geometry?.location;
    if (loc?.lat == null || loc?.lng == null) throw new Error("No coordinates for that place.");

    return {
      lat: loc.lat,
      lng: loc.lng,
      formatted: top.formatted_address ?? data.query,
      city: part(top.address_components, "locality") ?? part(top.address_components, "postal_town"),
      state: part(top.address_components, "administrative_area_level_1"),
      postal: part(top.address_components, "postal_code"),
    };
  });