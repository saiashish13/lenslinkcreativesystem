// Google Places API (New) integration via the Lovable connector gateway.
// Surfaces real photographers / videographers / editors as creator_listings
// in our database. All Places-derived data refreshed at least every 30 days
// per Google's caching policy.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify, type ListingCategory } from "@/lib/listings";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const SearchInput = z.object({
  query: z.string().min(2).max(200),
  city: z.string().min(2).max(80).optional(),
  category: z.enum(["photographer", "videographer", "editor"]).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().min(1).max(50).optional(),
});

interface PlacesResponse {
  places?: Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    location?: { latitude?: number; longitude?: number };
    rating?: number;
    userRatingCount?: number;
    types?: string[];
    addressComponents?: Array<{
      longText?: string;
      types?: string[];
    }>;
    photos?: Array<{
      name?: string;
      widthPx?: number;
      heightPx?: number;
      authorAttributions?: Array<{ displayName?: string; uri?: string }>;
    }>;
    businessStatus?: string;
  }>;
}

function categoryQueryFragment(c?: ListingCategory): string {
  if (c === "videographer") return "videographer videography";
  if (c === "editor") return "photo editor video editor";
  return "photographer photography studio";
}

function extractAddressPart(
  components: Array<{ longText?: string; types?: string[] }> | undefined,
  type: string,
): string | null {
  if (!components) return null;
  const c = components.find((x) => x.types?.includes(type));
  return c?.longText ?? null;
}

function photoMediaUrl(name: string, browserKey: string): string {
  // Public photo media endpoint; safe for browser display, attribution shown
  // in the UI. We avoid proxying through the server for now.
  return `https://places.googleapis.com/v1/${name}/media?maxWidthPx=1600&key=${browserKey}`;
}

/** Rate-limit: 30 requests / hour / user. Returns true if allowed. */
async function checkRateLimit(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("places_search_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  return (count ?? 0) < 30;
}

/** IP-based rate-limit for anonymous public searches: 6 / hour / IP. */
async function checkIpRateLimit(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("places_search_log")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  return (count ?? 0) < 6;
}

/** Shared core: query Places, upsert listings + photos, return slug list. */
async function runPlacesImport(data: z.infer<typeof SearchInput>) {
  const apiKey = process.env.LOVABLE_API_KEY;
  const connKey = process.env.GOOGLE_MAPS_API_KEY;
  const browserKey = process.env.GOOGLE_MAPS_BROWSER_KEY;
  if (!apiKey || !connKey || !browserKey) throw new Error("Google Maps connector not configured");

  const textQuery = [data.query, categoryQueryFragment(data.category), data.city ?? "India"]
    .filter(Boolean)
    .join(" ");

  const body: Record<string, unknown> = { textQuery, languageCode: "en", regionCode: "IN" };
  if (data.lat != null && data.lng != null) {
    body.locationBias = {
      circle: {
        center: { latitude: data.lat, longitude: data.lng },
        radius: (data.radiusKm ?? 25) * 1000,
      },
    };
  }

  const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
      "X-Goog-FieldMask": [
        "places.id", "places.displayName", "places.formattedAddress",
        "places.nationalPhoneNumber", "places.internationalPhoneNumber",
        "places.websiteUri", "places.location", "places.rating",
        "places.userRatingCount", "places.types", "places.addressComponents",
        "places.photos", "places.businessStatus",
      ].join(","),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Places API ${res.status}: ${txt.slice(0, 200)}`);
  }

  const json = (await res.json()) as PlacesResponse;
  const places = json.places ?? [];
  const now = new Date().toISOString();
  const imported: { slug: string; business_name: string }[] = [];

  for (const p of places) {
    if (!p.id || !p.displayName?.text) continue;
    if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;

    const businessName = p.displayName.text;
    const city = extractAddressPart(p.addressComponents, "locality")
      ?? extractAddressPart(p.addressComponents, "administrative_area_level_2");
    const state = extractAddressPart(p.addressComponents, "administrative_area_level_1");
    const country = extractAddressPart(p.addressComponents, "country") ?? "India";

    const baseSlug = slugify(businessName);
    const slug = `${baseSlug || "creator"}-${p.id.slice(-6).toLowerCase()}`;

    const photos = (p.photos ?? []).slice(0, 6);
    const coverPhoto = photos[0];

    const inferredCategories: string[] = (() => {
      if (data.category) return [data.category];
      const types = p.types ?? [];
      if (types.includes("videographer") || /video/i.test(businessName)) return ["videographer"];
      if (/editor|edit\s*studio/i.test(businessName)) return ["editor"];
      return ["photographer"];
    })();

    const { data: existing } = await supabaseAdmin
      .from("creator_listings")
      .select("id, owner_user_id, source")
      .eq("google_place_id", p.id)
      .maybeSingle();

    const listingPayload = {
      google_place_id: p.id,
      slug,
      source: (existing?.source ?? "google_places") as "google_places" | "claimed",
      business_name: businessName,
      display_name: businessName,
      categories: inferredCategories,
      city,
      state,
      country,
      formatted_address: p.formattedAddress ?? null,
      lat: p.location?.latitude ?? null,
      lng: p.location?.longitude ?? null,
      phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
      website: p.websiteUri ?? null,
      cover_url: coverPhoto?.name ? photoMediaUrl(coverPhoto.name, browserKey) : null,
      places_rating: p.rating ?? null,
      places_review_count: p.userRatingCount ?? 0,
      places_last_synced_at: now,
      is_published: true,
    };

    let listingId = existing?.id;
    if (existing) {
      await supabaseAdmin.from("creator_listings").update(listingPayload).eq("id", existing.id);
    } else {
      const { data: ins, error: insErr } = await supabaseAdmin
        .from("creator_listings")
        .insert(listingPayload)
        .select("id")
        .single();
      if (insErr) {
        const { data: ins2 } = await supabaseAdmin
          .from("creator_listings")
          .insert({ ...listingPayload, slug: `${slug}-${Date.now().toString(36)}` })
          .select("id")
          .single();
        listingId = ins2?.id;
      } else {
        listingId = ins?.id;
      }
    }

    if (listingId && photos.length) {
      await supabaseAdmin.from("listing_photos").delete().eq("listing_id", listingId);
      const rows = photos
        .filter((ph) => ph.name)
        .map((ph, idx) => ({
          listing_id: listingId!,
          url: photoMediaUrl(ph.name!, browserKey),
          source: "google_places" as const,
          width: ph.widthPx ?? null,
          height: ph.heightPx ?? null,
          attribution_html: (ph.authorAttributions ?? [])
            .map((a) => a.uri && a.displayName ? `<a href="${a.uri}" rel="noopener">${a.displayName}</a>` : a.displayName ?? "")
            .filter(Boolean)
            .join(", ") || null,
          position: idx,
        }));
      if (rows.length) await supabaseAdmin.from("listing_photos").insert(rows);
    }

    imported.push({ slug, business_name: businessName });
  }

  return { imported, count: imported.length };
}

/**
 * Public on-demand Places search. Triggered from the marketplace empty-state
 * so users always see real results in their city. Rate-limited per IP.
 */
export const searchPlacesPublic = createServerFn({ method: "POST" })
  .inputValidator((i) => SearchInput.parse(i))
  .handler(async ({ data }) => {
    let ip = "unknown";
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      ip = getRequestHeader("cf-connecting-ip")
        ?? getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim()
        ?? "unknown";
    } catch {/* noop */}
    if (!(await checkIpRateLimit(ip))) {
      throw new Error("Too many searches. Please try again in an hour.");
    }
    await supabaseAdmin.from("places_search_log").insert({ ip, query: data.query });
    return runPlacesImport(data);
  });

/**
 * Admin-only bulk importer: runs Places import across many city×category
 * combos in a single call. Skips combos that would exceed the per-user
 * hourly rate limit and reports what was done.
 */
const BulkInput = z.object({
  query: z.string().min(2).max(120).optional().default("wedding"),
  cities: z.array(z.string().min(2).max(80)).min(1).max(30),
  categories: z.array(z.enum(["photographer", "videographer", "editor"])).min(1),
});

export const bulkImportPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => BulkInput.parse(i))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Admin role required");

    const { data: job } = await supabaseAdmin
      .from("import_jobs")
      .insert({
        provider: "google_places",
        job_type: "bulk",
        status: "running",
        triggered_by: userId,
        input: data,
      })
      .select("id")
      .single();

    const results: Array<{ city: string; category: string; imported: number; skipped?: string }> = [];
    let totalImported = 0;

    for (const city of data.cities) {
      for (const category of data.categories) {
        if (!(await checkRateLimit(userId))) {
          results.push({ city, category, imported: 0, skipped: "rate_limit" });
          continue;
        }
        await supabaseAdmin.from("places_search_log").insert({
          user_id: userId,
          query: `${data.query} ${category} ${city}`,
        });
        try {
          const r = await runPlacesImport({ query: data.query, city, category });
          results.push({ city, category, imported: r.count });
          totalImported += r.count;
        } catch (err) {
          results.push({ city, category, imported: 0, skipped: err instanceof Error ? err.message : "error" });
        }
      }
    }

    const anyRun = results.some((r) => !r.skipped);
    const anySkipped = results.some((r) => r.skipped);
    const status = !anyRun ? "failed" : anySkipped ? "partial" : "success";
    if (job?.id) {
      await supabaseAdmin
        .from("import_jobs")
        .update({ status, results, total_imported: totalImported, finished_at: new Date().toISOString() })
        .eq("id", job.id);
    }

    return { totalImported, results };
  });

/**
 * Searches Google Places and upserts results into creator_listings.
 * Admin-only. Returns the imported listing slugs.
 */
export const searchAndImportPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => SearchInput.parse(i))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // Admin check
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Admin role required");

    if (!(await checkRateLimit(userId))) {
      throw new Error("Rate limit reached (30 imports/hour). Try again later.");
    }
    await supabaseAdmin.from("places_search_log").insert({ user_id: userId, query: data.query });

    const { data: job } = await supabaseAdmin
      .from("import_jobs")
      .insert({
        provider: "google_places",
        job_type: "single",
        status: "running",
        triggered_by: userId,
        input: data,
      })
      .select("id")
      .single();
    const finish = async (status: string, extra: Record<string, unknown>) => {
      if (!job?.id) return;
      await supabaseAdmin
        .from("import_jobs")
        .update({ status, finished_at: new Date().toISOString(), ...extra })
        .eq("id", job.id);
    };
    try {
      const r = await runPlacesImport(data);
      await finish("success", {
        total_imported: r.count,
        results: [{ city: data.city ?? "any", category: data.category ?? "any", imported: r.count }],
      });
      return r;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import failed";
      await finish("failed", { error: msg });
      throw err;
    }
  });

// Legacy inline body kept below (dead) — replaced by runPlacesImport call above.
const _legacySearchAndImportPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => SearchInput.parse(i))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Admin role required");

    const apiKey = process.env.LOVABLE_API_KEY;
    const connKey = process.env.GOOGLE_MAPS_API_KEY;
    const browserKey = process.env.GOOGLE_MAPS_BROWSER_KEY;
    if (!apiKey || !connKey || !browserKey) throw new Error("Google Maps connector not configured");

    const textQuery = [data.query, categoryQueryFragment(data.category), data.city ?? "India"]
      .filter(Boolean)
      .join(" ");

    const body: Record<string, unknown> = { textQuery, languageCode: "en", regionCode: "IN" };
    if (data.lat != null && data.lng != null) {
      body.locationBias = {
        circle: {
          center: { latitude: data.lat, longitude: data.lng },
          radius: (data.radiusKm ?? 25) * 1000,
        },
      };
    }

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Connection-Api-Key": connKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": [
          "places.id", "places.displayName", "places.formattedAddress",
          "places.nationalPhoneNumber", "places.internationalPhoneNumber",
          "places.websiteUri", "places.location", "places.rating",
          "places.userRatingCount", "places.types", "places.addressComponents",
          "places.photos", "places.businessStatus",
        ].join(","),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Places API ${res.status}: ${txt.slice(0, 200)}`);
    }

    const json = (await res.json()) as PlacesResponse;
    const places = json.places ?? [];
    const now = new Date().toISOString();
    const imported: { slug: string; business_name: string }[] = [];

    for (const p of places) {
      if (!p.id || !p.displayName?.text) continue;
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;

      const businessName = p.displayName.text;
      const city = extractAddressPart(p.addressComponents, "locality")
        ?? extractAddressPart(p.addressComponents, "administrative_area_level_2");
      const state = extractAddressPart(p.addressComponents, "administrative_area_level_1");
      const country = extractAddressPart(p.addressComponents, "country") ?? "India";

      // Slug uniqueness: use place_id suffix to keep deterministic
      const baseSlug = slugify(businessName);
      const slug = `${baseSlug || "creator"}-${p.id.slice(-6).toLowerCase()}`;

      const photos = (p.photos ?? []).slice(0, 6);
      const coverPhoto = photos[0];

      const inferredCategories: string[] = (() => {
        if (data.category) return [data.category];
        const types = p.types ?? [];
        if (types.includes("videographer") || /video/i.test(businessName)) return ["videographer"];
        if (/editor|edit\s*studio/i.test(businessName)) return ["editor"];
        return ["photographer"];
      })();

      const { data: existing } = await supabaseAdmin
        .from("creator_listings")
        .select("id, owner_user_id, source")
        .eq("google_place_id", p.id)
        .maybeSingle();

      const listingPayload = {
        google_place_id: p.id,
        slug,
        source: (existing?.source ?? "google_places") as "google_places" | "claimed",
        business_name: businessName,
        display_name: businessName,
        categories: inferredCategories,
        city,
        state,
        country,
        formatted_address: p.formattedAddress ?? null,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
        website: p.websiteUri ?? null,
        cover_url: coverPhoto?.name ? photoMediaUrl(coverPhoto.name, browserKey) : null,
        places_rating: p.rating ?? null,
        places_review_count: p.userRatingCount ?? 0,
        places_last_synced_at: now,
        is_published: true,
      };

      let listingId = existing?.id;
      if (existing) {
        await supabaseAdmin.from("creator_listings").update(listingPayload).eq("id", existing.id);
      } else {
        const { data: ins, error: insErr } = await supabaseAdmin
          .from("creator_listings")
          .insert(listingPayload)
          .select("id")
          .single();
        if (insErr) {
          // Slug collision fallback — append timestamp
          const { data: ins2 } = await supabaseAdmin
            .from("creator_listings")
            .insert({ ...listingPayload, slug: `${slug}-${Date.now().toString(36)}` })
            .select("id")
            .single();
          listingId = ins2?.id;
        } else {
          listingId = ins?.id;
        }
      }

      if (listingId && photos.length) {
        // Replace photos with fresh batch
        await supabaseAdmin.from("listing_photos").delete().eq("listing_id", listingId);
        const rows = photos
          .filter((ph) => ph.name)
          .map((ph, idx) => ({
            listing_id: listingId!,
            url: photoMediaUrl(ph.name!, browserKey),
            source: "google_places" as const,
            width: ph.widthPx ?? null,
            height: ph.heightPx ?? null,
            attribution_html: (ph.authorAttributions ?? [])
              .map((a) => a.uri && a.displayName ? `<a href="${a.uri}" rel="noopener">${a.displayName}</a>` : a.displayName ?? "")
              .filter(Boolean)
              .join(", ") || null,
            position: idx,
          }));
        if (rows.length) await supabaseAdmin.from("listing_photos").insert(rows);
      }

      imported.push({ slug, business_name: businessName });
    }

    return { imported, count: imported.length };
  });

/** Refresh a single listing from Places (used on profile view if stale, and by cron). */
export const refreshListingFromPlaces = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ listingId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    const connKey = process.env.GOOGLE_MAPS_API_KEY;
    const browserKey = process.env.GOOGLE_MAPS_BROWSER_KEY;
    if (!apiKey || !connKey || !browserKey) return { refreshed: false };

    const { data: listing } = await supabaseAdmin
      .from("creator_listings")
      .select("id, google_place_id, places_last_synced_at, source")
      .eq("id", data.listingId)
      .maybeSingle();
    if (!listing?.google_place_id) return { refreshed: false };

    const ageMs = listing.places_last_synced_at
      ? Date.now() - new Date(listing.places_last_synced_at).getTime()
      : Infinity;
    if (ageMs < 1000 * 60 * 60 * 24 * 7) return { refreshed: false }; // skip if < 7 days

    const res = await fetch(`${GATEWAY_URL}/places/v1/places/${listing.google_place_id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Connection-Api-Key": connKey,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,location,rating,userRatingCount,photos,businessStatus",
      },
    });
    if (!res.ok) return { refreshed: false };
    const p = (await res.json()) as NonNullable<PlacesResponse["places"]>[number];
    if (!p?.id) return { refreshed: false };

    await supabaseAdmin
      .from("creator_listings")
      .update({
        formatted_address: p.formattedAddress ?? null,
        phone: p.nationalPhoneNumber ?? null,
        website: p.websiteUri ?? null,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        places_rating: p.rating ?? null,
        places_review_count: p.userRatingCount ?? 0,
        places_last_synced_at: new Date().toISOString(),
        is_published: p.businessStatus ? p.businessStatus === "OPERATIONAL" : true,
      })
      .eq("id", listing.id);

    return { refreshed: true };
  });