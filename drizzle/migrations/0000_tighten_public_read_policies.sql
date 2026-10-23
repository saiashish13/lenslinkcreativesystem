-- Tighten overly permissive public-read policies flagged by the security scan.
-- Public marketplace display of these rows is served through the privileged
-- server-side client, so owner/admin-scoped RLS is sufficient for every
-- legitimate client flow.

-- profiles: only the owner and admins may read (the table carries phone numbers).
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles: owner or admin can read"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- reviews: only the review author may read via the Data API; public profile
-- display of reviews is served by the server-side client.
DROP POLICY IF EXISTS "Reviews public read" ON public.reviews;
CREATE POLICY "Reviews: author can read"
ON public.reviews
FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- portfolio_items: creator-owned rows only.
DROP POLICY IF EXISTS "Portfolio public read" ON public.portfolio_items;
CREATE POLICY "Portfolio: owner can read"
ON public.portfolio_items
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- availability_slots: creator-owned rows only.
DROP POLICY IF EXISTS "Availability public read" ON public.availability_slots;
CREATE POLICY "Availability: owner can read"
ON public.availability_slots
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- pricing_packages: creator-owned rows only.
DROP POLICY IF EXISTS "Packages public read" ON public.pricing_packages;
CREATE POLICY "Packages: owner can read"
ON public.pricing_packages
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- storage: listing files in the portfolio bucket is no longer open to
-- everyone; reads are tied to the uploading owner's folder. The bucket stays
-- public, so public URL access to individual files is unaffected.
DROP POLICY IF EXISTS "Portfolio media public read" ON storage.objects;
CREATE POLICY "Portfolio media: owner can list"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'portfolio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
