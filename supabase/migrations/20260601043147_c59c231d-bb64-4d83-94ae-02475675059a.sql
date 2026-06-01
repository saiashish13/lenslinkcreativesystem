
-- =====================================================
-- Phase 1: wipe demo data tied to fake seeded handles
-- =====================================================
DELETE FROM public.reviews;
DELETE FROM public.messages;
DELETE FROM public.bookings;
DELETE FROM public.portfolio_items;
DELETE FROM public.pricing_packages;
DELETE FROM public.availability_slots;
DELETE FROM public.editor_assignments;
DELETE FROM public.project_files;
DELETE FROM public.project_revisions;
DELETE FROM public.favorites;

-- =====================================================
-- Phase 2: enums
-- =====================================================
CREATE TYPE public.listing_source AS ENUM ('self_serve', 'google_places', 'claimed');
CREATE TYPE public.verification_status AS ENUM ('unverified', 'email_verified', 'id_verified', 'business_verified');
CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.photo_source AS ENUM ('google_places', 'uploaded');

-- =====================================================
-- creator_listings — the unified listing table
-- =====================================================
CREATE TABLE public.creator_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source public.listing_source NOT NULL DEFAULT 'self_serve',
  google_place_id text UNIQUE,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  business_name text NOT NULL,
  display_name text,
  tagline text,
  bio text,
  categories text[] NOT NULL DEFAULT '{}',
  specialties text[] NOT NULL DEFAULT '{}',
  city text,
  state text,
  country text DEFAULT 'India',
  formatted_address text,
  lat double precision,
  lng double precision,
  phone text,
  email text,
  website text,
  instagram text,
  cover_url text,
  avatar_url text,
  min_price_inr integer,
  max_price_inr integer,
  response_time_hours integer,
  places_rating numeric(2,1),
  places_review_count integer DEFAULT 0,
  places_last_synced_at timestamptz,
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_creator_listings_city ON public.creator_listings (lower(city));
CREATE INDEX idx_creator_listings_categories ON public.creator_listings USING gin (categories);
CREATE INDEX idx_creator_listings_published ON public.creator_listings (is_published) WHERE is_published = true;
CREATE INDEX idx_creator_listings_owner ON public.creator_listings (owner_user_id);
CREATE INDEX idx_creator_listings_geo ON public.creator_listings (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

GRANT SELECT ON public.creator_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_listings TO authenticated;
GRANT ALL ON public.creator_listings TO service_role;

ALTER TABLE public.creator_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published listings public read"
  ON public.creator_listings FOR SELECT
  USING (is_published = true OR auth.uid() = owner_user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can create own listing"
  ON public.creator_listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id AND source = 'self_serve');

CREATE POLICY "Owner updates own listing"
  ON public.creator_listings FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Admins manage all listings"
  ON public.creator_listings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_creator_listings_updated
  BEFORE UPDATE ON public.creator_listings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================
-- listing_photos
-- =====================================================
CREATE TABLE public.listing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.creator_listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  source public.photo_source NOT NULL DEFAULT 'uploaded',
  attribution_html text,
  width integer,
  height integer,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_photos_listing ON public.listing_photos (listing_id, position);

GRANT SELECT ON public.listing_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_photos TO authenticated;
GRANT ALL ON public.listing_photos TO service_role;

ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos public read for published listings"
  ON public.listing_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.creator_listings l
    WHERE l.id = listing_photos.listing_id
      AND (l.is_published = true OR l.owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Owner manages own listing photos"
  ON public.listing_photos FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.creator_listings l
    WHERE l.id = listing_photos.listing_id AND l.owner_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.creator_listings l
    WHERE l.id = listing_photos.listing_id AND l.owner_user_id = auth.uid()
  ));

CREATE POLICY "Admins manage all photos"
  ON public.listing_photos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- claim_requests
-- =====================================================
CREATE TABLE public.claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.creator_listings(id) ON DELETE CASCADE,
  claimant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_email text,
  proof_url text,
  notes text,
  status public.claim_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, claimant_user_id)
);

CREATE INDEX idx_claim_requests_status ON public.claim_requests (status);
CREATE INDEX idx_claim_requests_listing ON public.claim_requests (listing_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.claim_requests TO authenticated;
GRANT ALL ON public.claim_requests TO service_role;

ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Claimant views own claims"
  ON public.claim_requests FOR SELECT TO authenticated
  USING (auth.uid() = claimant_user_id);

CREATE POLICY "Admins view all claims"
  ON public.claim_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated submit claims"
  ON public.claim_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = claimant_user_id);

CREATE POLICY "Admins update claims"
  ON public.claim_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_claim_requests_updated
  BEFORE UPDATE ON public.claim_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================
-- Extend existing tables with listing_id
-- =====================================================
ALTER TABLE public.bookings
  ADD COLUMN listing_id uuid REFERENCES public.creator_listings(id) ON DELETE SET NULL,
  ALTER COLUMN professional_handle DROP NOT NULL;
CREATE INDEX idx_bookings_listing ON public.bookings (listing_id);

ALTER TABLE public.portfolio_items
  ADD COLUMN listing_id uuid REFERENCES public.creator_listings(id) ON DELETE CASCADE;
CREATE INDEX idx_portfolio_items_listing ON public.portfolio_items (listing_id);

ALTER TABLE public.pricing_packages
  ADD COLUMN listing_id uuid REFERENCES public.creator_listings(id) ON DELETE CASCADE;
CREATE INDEX idx_pricing_packages_listing ON public.pricing_packages (listing_id);

ALTER TABLE public.availability_slots
  ADD COLUMN listing_id uuid REFERENCES public.creator_listings(id) ON DELETE CASCADE;
CREATE INDEX idx_availability_slots_listing ON public.availability_slots (listing_id);

ALTER TABLE public.reviews
  ADD COLUMN listing_id uuid REFERENCES public.creator_listings(id) ON DELETE CASCADE,
  ALTER COLUMN professional_handle DROP NOT NULL;
CREATE INDEX idx_reviews_listing ON public.reviews (listing_id);

ALTER TABLE public.favorites
  ADD COLUMN listing_id uuid REFERENCES public.creator_listings(id) ON DELETE CASCADE,
  ALTER COLUMN professional_handle DROP NOT NULL;
CREATE INDEX idx_favorites_listing ON public.favorites (listing_id, customer_id);

-- =====================================================
-- Booking guard: prevent bookings to unclaimed Places listings
-- =====================================================
CREATE OR REPLACE FUNCTION public.guard_booking_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l_source public.listing_source;
  l_owner uuid;
  l_published boolean;
BEGIN
  IF NEW.listing_id IS NULL THEN RETURN NEW; END IF;
  SELECT source, owner_user_id, is_published INTO l_source, l_owner, l_published
    FROM public.creator_listings WHERE id = NEW.listing_id;
  IF NOT FOUND OR NOT l_published THEN
    RAISE EXCEPTION 'Listing is not available for booking';
  END IF;
  IF l_source = 'google_places' OR l_owner IS NULL THEN
    RAISE EXCEPTION 'This listing has not been claimed by its owner — bookings are disabled until the business claims their profile.';
  END IF;
  NEW.creator_user_id := l_owner;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_bookings_guard
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.guard_booking_listing();

-- =====================================================
-- Rate-limit table for Google Places searches
-- =====================================================
CREATE TABLE public.places_search_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  ip text,
  query text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_places_search_log_recent ON public.places_search_log (created_at DESC);
CREATE INDEX idx_places_search_log_user ON public.places_search_log (user_id, created_at DESC);

GRANT ALL ON public.places_search_log TO service_role;
ALTER TABLE public.places_search_log ENABLE ROW LEVEL SECURITY;
-- No public policies — service_role only.
