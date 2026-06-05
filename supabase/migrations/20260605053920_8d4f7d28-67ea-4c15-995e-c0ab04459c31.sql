ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pref_lat double precision,
  ADD COLUMN IF NOT EXISTS pref_lng double precision,
  ADD COLUMN IF NOT EXISTS pref_location_label text,
  ADD COLUMN IF NOT EXISTS pref_location_source text CHECK (pref_location_source IN ('gps','manual')),
  ADD COLUMN IF NOT EXISTS pref_radius_km integer CHECK (pref_radius_km BETWEEN 1 AND 200);