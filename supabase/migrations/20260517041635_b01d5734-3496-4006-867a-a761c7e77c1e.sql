
-- Portfolio items
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio public read" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Creators insert own portfolio" ON public.portfolio_items FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators update own portfolio" ON public.portfolio_items FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators delete own portfolio" ON public.portfolio_items FOR DELETE USING (auth.uid() = creator_id);
CREATE POLICY "Admins manage portfolio" ON public.portfolio_items FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER portfolio_items_updated_at BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Availability slots
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_booked BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability public read" ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "Creators insert own slots" ON public.availability_slots FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators update own slots" ON public.availability_slots FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators delete own slots" ON public.availability_slots FOR DELETE USING (auth.uid() = creator_id);

CREATE INDEX idx_availability_creator_date ON public.availability_slots(creator_id, slot_date);

-- Pricing packages
CREATE TABLE public.pricing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_inr INTEGER NOT NULL,
  delivery_days INTEGER NOT NULL DEFAULT 7,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages public read" ON public.pricing_packages FOR SELECT USING (true);
CREATE POLICY "Creators insert own packages" ON public.pricing_packages FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators update own packages" ON public.pricing_packages FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators delete own packages" ON public.pricing_packages FOR DELETE USING (auth.uid() = creator_id);

CREATE TRIGGER pricing_packages_updated_at BEFORE UPDATE ON public.pricing_packages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Bookings: allow assigned creator to view and update status.
-- We match by handle being equal to the creator profile's handle. Since we don't
-- have a handle column on profiles, we link via a new creator_user_id column.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS creator_user_id UUID;

CREATE POLICY "Creators view assigned bookings" ON public.bookings FOR SELECT
  USING (auth.uid() = creator_user_id);
CREATE POLICY "Creators update assigned booking status" ON public.bookings FOR UPDATE
  USING (auth.uid() = creator_user_id);

-- Storage bucket for portfolio media
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Portfolio media public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');
CREATE POLICY "Creators upload own portfolio media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Creators update own portfolio media" ON storage.objects FOR UPDATE
  USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Creators delete own portfolio media" ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
