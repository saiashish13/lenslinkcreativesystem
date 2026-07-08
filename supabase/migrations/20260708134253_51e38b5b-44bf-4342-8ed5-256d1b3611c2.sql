
CREATE TABLE public.import_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL DEFAULT 'google_places',
  job_type text NOT NULL CHECK (job_type IN ('single','bulk','partner')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','failed','partial')),
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_imported integer NOT NULL DEFAULT 0,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT ON public.import_jobs TO authenticated;
GRANT ALL ON public.import_jobs TO service_role;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view import jobs" ON public.import_jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX import_jobs_started_at_idx ON public.import_jobs (started_at DESC);

CREATE TABLE public.provider_connectors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'not_configured' CHECK (status IN ('not_configured','ready','error','unsupported')),
  last_tested_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.provider_connectors TO service_role;
ALTER TABLE public.provider_connectors ENABLE ROW LEVEL SECURITY;
-- No policies for regular users; access only via service role in admin server fns.
CREATE TRIGGER provider_connectors_updated_at BEFORE UPDATE ON public.provider_connectors FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.provider_connectors (slug, name, status, notes) VALUES
  ('wedmegood','WedMeGood','unsupported','No public partner API. Requires business development contact with WedMeGood to unlock a partner feed.'),
  ('bookmyshoot','BookMyShoot','unsupported','No documented public partner API. Contact BookMyShoot partnerships for a feed.'),
  ('zoopgo','ZoopGo','unsupported','No public partner API. Reach out to ZoopGo for a lead-sharing partnership.'),
  ('upwork','Upwork','not_configured','Requires an approved Upwork API key + OAuth. Fill credentials.access_token and credentials.client_id once approved.'),
  ('freelancer','Freelancer.com','not_configured','Requires an OAuth access token from https://developers.freelancer.com. Fill credentials.access_token.'),
  ('creativepool','Creativepool','unsupported','No public partner API. Requires a direct partnership agreement.');
