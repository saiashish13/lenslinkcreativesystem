## Goal

Transform the demo into a real, production-grade marketplace by combining all four directions: A (Google Places live data), B (self-serve real signups), C (claim-your-listing hybrid), D (premium UI redesign).

No fake data anywhere. The seeded `PROFESSIONALS` array, fake reviews, fake portfolios, and demo creator pages are removed.

---

## Prerequisites (you provide)

1. **Google Maps Platform API key** with these APIs enabled:
   - Places API (New)
   - Geocoding API
   - Maps JavaScript API (for the map view)
   Billing must be enabled on the Google Cloud project. I'll store it as `GOOGLE_MAPS_API_KEY` (server-side) and a separate restricted public key `VITE_GOOGLE_MAPS_BROWSER_KEY` for the map widget.
2. Confirm you understand Google's caching rules: Place IDs can be stored forever, but most other Places fields (name, address, rating, photos) must be refreshed at least every 30 days. I'll build the refresh job accordingly.
3. Decide payments later — I'll keep the existing booking flow as "request quote" until you wire Stripe with your own keys.

If you don't have the Google key yet, I can still ship phases 1, 2, 4, 5, 6 — phase 3 just stays dormant until the key lands.

---

## Phase 1 — Remove all fake data

- Delete `src/lib/professionals.ts` seed array, `src/assets/pro-*.jpg` stock images, and any component that renders them.
- Drop the demo `creators/$handle` route's hardcoded fallback path.
- Add a one-time migration that truncates any seeded rows in `bookings`, `reviews`, `portfolio_items`, `pricing_packages` from prior demos.
- Replace marketplace empty state with real "no creators yet — be the first" CTA.

## Phase 2 — Schema for real listings

New tables:
- `creator_listings` — unified listing row (works for self-serve, Places-imported, and claimed). Columns: `id`, `source` enum (`self_serve` | `google_places` | `claimed`), `google_place_id` (nullable, unique), `owner_user_id` (nullable until claimed), `business_name`, `display_name`, `slug` (unique), `categories` text[], `specialties` text[], `city`, `state`, `country`, `lat`, `lng`, `phone`, `website`, `instagram`, `cover_url`, `avatar_url`, `bio`, `min_price_inr`, `max_price_inr`, `places_rating`, `places_review_count`, `places_last_synced_at`, `verification_status` enum (`unverified` | `email_verified` | `id_verified` | `business_verified`), `is_published`, timestamps.
- `listing_photos` — `id`, `listing_id`, `url`, `source` (`google_places` | `uploaded`), `attribution` (for Google photo HTML attribution), `position`.
- `claim_requests` — `id`, `listing_id`, `claimant_user_id`, `proof_url`, `status` enum, `reviewed_by`, timestamps.
- Extend `bookings` to reference `listing_id` (uuid) instead of free-text `professional_handle`.
- RLS: public read on `is_published=true` listings + their photos; owner can write own listing; admin can write any; claim requests visible to claimant + admins.
- GRANTs for `anon` (public read of published rows only) + `authenticated` + `service_role`.

## Phase 3 — Google Places integration (live data)

- Server fn `searchPlaces({ query, city, lat, lng, radiusKm, category })` → calls Places API (New) Text Search, normalizes results, upserts into `creator_listings` with `source='google_places'`, fetches up to 6 photos per place, stores Place IDs.
- Server fn `refreshListing(listingId)` → re-fetches Place Details if `places_last_synced_at` > 30 days; called lazily on profile view + by a daily cron.
- Cron via TanStack server route `/api/public/cron/refresh-places` (signed with `CRON_SECRET`) — refreshes the oldest 200 listings nightly.
- Photo attribution rendered on every Places-sourced image per Google's ToS.
- Hard guard: any listing with `source='google_places'` and no claim shows "Unclaimed listing — claim this profile" banner; booking is disabled until claimed (so we never broker bookings for businesses that haven't opted in).

## Phase 4 — Self-serve onboarding (creators)

- `/onboarding/creator` multi-step: business basics → categories → portfolio upload → pricing packages → availability → publish.
- Email verification gate before `is_published=true`.
- Existing `portfolio_items`, `pricing_packages`, `availability_slots` tables already fit — wire them to `listing_id`.
- Storage bucket `portfolio` (exists) for uploads; enforce mime + size in a server fn.

## Phase 5 — Claim-your-listing flow

- On unclaimed Places listing page: "Is this your business? Claim it" → `/claim/$listingId`.
- Claimant submits: business email matching `website` domain OR uploads ID + business doc to private storage.
- Admin queue at `/admin/claims` to approve/reject; on approve, set `owner_user_id`, flip `source` to `claimed`, send notification.

## Phase 6 — Search, discovery, location

- Marketplace page rebuilt:
  - Hero search: service + location + budget (3 inputs, one CTA).
  - "Use my location" button → browser geolocation → reverse geocode → radius filter (5/10/25/50 km).
  - Filters: 11 photo subcategories, 7 video subcategories, 7 editor subcategories, budget bands (<1k / 1–5k / 5–10k / 10–25k / 25k+), min rating, verified-only, available-this-week.
  - Sort: price asc (default — affordable first per your spec), rating desc, review count desc, distance asc, response-time asc.
  - Server-side pagination via TanStack Query + cursor.
  - Map view toggle (Google Maps JS) with pins.
- Empty marketplace? Fall back to Places search live (phase 3) so users always see results in their city.

## Phase 7 — Premium UI redesign

I'll run the design-directions ritual on:
- Homepage (hero, search, featured, top-rated, budget-friendly, nearby, categories, testimonials — testimonials section only renders if real reviews exist, otherwise hidden).
- Marketplace results.
- Profile page (cover, avatar, gallery, about, pricing, availability calendar, real reviews, booking CTA, social links, verified badges).

Aesthetic targets: Airbnb-grade spacing + Frame.io darkness + Calendly clarity. Glassmorphic nav, smooth Motion-for-React transitions, full light/dark, mobile-first.

## Phase 8 — Booking, verification, admin

- Booking flow: request quote → creator accepts → consultation scheduled via `availability_slots` → files via `project_files` → status tracking (existing schema covers this).
- Verification badges: email, ID (manual admin review), business (claim approved), portfolio (admin spot-check). Each shown on profile.
- Admin dashboard `/admin`: pending claims, pending verifications, review moderation, listing publish/unpublish, basic revenue stats once payments land.

## Phase 9 — SEO

- Per-city pages: `/photographers/$city`, `/videographers/$city`, `/editors/$city` — TanStack route with loader, dynamic title/description/canonical, JSON-LD `LocalBusiness` schema per listed creator.
- Per-category landing pages with internal links to city pages.
- Per-profile JSON-LD `ProfessionalService` schema with real `aggregateRating` (only when real reviews exist — otherwise omitted, never faked).
- `sitemap.xml` generated from `creator_listings` + city/category matrix.

## Phase 10 — Performance & compliance

- Image: serve Places photos through a proxy server route that caches in Supabase Storage (Places photo URLs expire), WebP conversion, width hints.
- Route-level code splitting (TanStack default), preload LCP image per route head().
- Lazy-load below-fold sections.
- Rate-limit Places search server fn (per-IP token bucket in `kv`-style table) to stay inside Google quota.
- Compliance copy in footer + ToS page noting Google attribution, refresh policy, no scraping.

---

## Technical notes

- Stack: TanStack Start + Supabase (Lovable Cloud) — already wired.
- Google Places calls live in `createServerFn` only; the API key never reaches the browser. The browser key is restricted (HTTP referrers + Maps JS only) and used solely for the map widget.
- All Places-derived data is treated as "display only, refresh ≤30 days" except Place IDs.
- Bookings for `source='google_places'` unclaimed listings are blocked — we won't broker for businesses that haven't opted in.
- Light/dark already in theme; I'll extend tokens for the redesign.

---

## What I'll need from you to start

1. Confirm "go" — this is a big multi-phase build, expect several rounds.
2. Whether you have the Google Maps API key ready now (drives phase 3 timing).
3. Confirm I should wipe all existing demo data (no users on prod yet, I assume).

I'll then start with phase 1 + 2 (data wipe + schema migration) and walk forward phase by phase, design-directions ritual at phase 7.