// Server fns for fetching real creator listings from the database.
// Public read by default — the marketplace and profile pages call these.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ListInput = z.object({
  q: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  category: z.enum(["photographer", "videographer", "editor"]).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  minRating: z.number().min(0).max(5).optional(),
  verifiedOnly: z.boolean().optional(),
  sort: z.enum(["price_asc", "rating_desc", "reviews_desc"]).optional().default("price_asc"),
  limit: z.number().int().min(1).max(60).optional().default(30),
  offset: z.number().int().min(0).optional().default(0),
});

export const listListings = createServerFn({ method: "POST" })
  .inputValidator((i) => ListInput.parse(i))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("creator_listings")
      .select("id,slug,business_name,display_name,categories,specialties,city,state,country,lat,lng,cover_url,avatar_url,min_price_inr,max_price_inr,places_rating,places_review_count,verification_status,source,owner_user_id,response_time_hours,tagline,formatted_address", { count: "exact" })
      .eq("is_published", true);

    if (data.q) q = q.ilike("business_name", `%${data.q}%`);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.category) q = q.contains("categories", [data.category]);
    if (data.minRating) q = q.gte("places_rating", data.minRating);
    if (data.minPrice != null) q = q.or(`min_price_inr.gte.${data.minPrice},min_price_inr.is.null`);
    if (data.maxPrice != null) q = q.or(`max_price_inr.lte.${data.maxPrice},max_price_inr.is.null`);
    if (data.verifiedOnly) q = q.in("verification_status", ["id_verified", "business_verified"]);

    switch (data.sort) {
      case "rating_desc":
        q = q.order("places_rating", { ascending: false, nullsFirst: false }).order("places_review_count", { ascending: false });
        break;
      case "reviews_desc":
        q = q.order("places_review_count", { ascending: false, nullsFirst: false });
        break;
      case "price_asc":
      default:
        q = q.order("min_price_inr", { ascending: true, nullsFirst: false }).order("places_rating", { ascending: false, nullsFirst: false });
    }

    q = q.range(data.offset, data.offset + data.limit - 1);

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { listings: rows ?? [], total: count ?? 0 };
  });

export const getListingBySlug = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ slug: z.string().min(1).max(120) }).parse(i))
  .handler(async ({ data }) => {
    const { data: listing } = await supabaseAdmin
      .from("creator_listings")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!listing) return { listing: null, photos: [], packages: [], reviews: [] };

    const [{ data: photos }, { data: packages }, { data: reviews }] = await Promise.all([
      supabaseAdmin.from("listing_photos").select("*").eq("listing_id", listing.id).order("position"),
      supabaseAdmin.from("pricing_packages").select("*").eq("listing_id", listing.id).eq("is_active", true).order("price_inr"),
      supabaseAdmin.from("reviews").select("id,rating,comment,created_at").eq("listing_id", listing.id).order("created_at", { ascending: false }).limit(20),
    ]);

    return {
      listing,
      photos: photos ?? [],
      packages: packages ?? [],
      reviews: reviews ?? [],
    };
  });

const UpsertOwnInput = z.object({
  id: z.string().uuid().optional(),
  business_name: z.string().min(2).max(120),
  tagline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  categories: z.array(z.enum(["photographer", "videographer", "editor"])).min(1),
  specialties: z.array(z.string().min(1).max(60)).max(20).optional(),
  city: z.string().min(1).max(80),
  state: z.string().max(80).optional(),
  country: z.string().max(80).optional().default("India"),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(120).optional(),
  website: z.string().url().max(200).optional().or(z.literal("")),
  instagram: z.string().max(80).optional(),
  min_price_inr: z.number().int().min(0).max(10_000_000).optional(),
  max_price_inr: z.number().int().min(0).max(10_000_000).optional(),
  response_time_hours: z.number().int().min(1).max(168).optional(),
  cover_url: z.string().url().optional().or(z.literal("")),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify } from "@/lib/listings";

export const upsertOwnListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => UpsertOwnInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const baseSlug = slugify(data.business_name) || "creator";
    const slug = `${baseSlug}-${userId.slice(0, 6)}`;

    const payload = {
      business_name: data.business_name,
      display_name: data.business_name,
      tagline: data.tagline ?? null,
      bio: data.bio ?? null,
      categories: data.categories,
      specialties: data.specialties ?? [],
      city: data.city,
      state: data.state ?? null,
      country: data.country ?? "India",
      phone: data.phone ?? null,
      email: data.email ?? null,
      website: data.website || null,
      instagram: data.instagram ?? null,
      min_price_inr: data.min_price_inr ?? null,
      max_price_inr: data.max_price_inr ?? null,
      response_time_hours: data.response_time_hours ?? null,
      cover_url: data.cover_url || null,
      avatar_url: data.avatar_url || null,
      owner_user_id: userId,
      source: "self_serve" as const,
      is_published: true,
      verification_status: "email_verified" as const,
    };

    if (data.id) {
      const { error } = await supabase.from("creator_listings").update(payload).eq("id", data.id).eq("owner_user_id", userId);
      if (error) throw new Error(error.message);
      return { id: data.id, slug };
    }

    const { data: ins, error } = await supabase
      .from("creator_listings")
      .insert({ ...payload, slug })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id, slug: ins.slug };
  });

export const getOwnListing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("creator_listings")
      .select("*")
      .eq("owner_user_id", userId)
      .maybeSingle();
    return { listing: data };
  });