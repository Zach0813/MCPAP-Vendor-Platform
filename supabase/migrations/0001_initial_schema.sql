-- =============================================================================
-- Magic City Plant-A-Palooza — initial schema
-- Migration: 0001_initial_schema.sql
-- =============================================================================
-- Apply with the Supabase CLI:
--   supabase db push
-- Or paste this into the Supabase Studio SQL editor for a one-shot setup.
--
-- This migration creates:
--   • All enums and tables from the spec
--   • Foreign keys, sensible defaults, and helpful indexes
--   • RLS enabled on every table, plus per-policy rules
--   • An `is_admin()` helper that reads the JWT's app_metadata.role claim
--   • Storage buckets `gallery` and `vendor-logos` with their own policies
--   • A seed row for the current event so /map has something to render
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- Note: PostgreSQL doesn't support IF NOT EXISTS for CREATE TYPE,
-- so we use DO blocks to safely create them only if they don't exist.
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.vendor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.request_type AS ENUM ('participation', 'cancellation', 'change');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.uploader_type AS ENUM ('guest', 'vendor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vendor_category AS ENUM ('plants', 'pots-decor', 'art', 'food', 'apparel', 'workshop', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- Helper: is_admin()
--   Reads `app_metadata.role` from the JWT. Admins are tagged like:
--     UPDATE auth.users
--     SET raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data,'{}'), '{role}', '"admin"')
--     WHERE email = 'organizer@…';
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- =============================================================================
-- TABLE: events
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year        integer NOT NULL,
  name        text NOT NULL,
  date_start  date NOT NULL,
  date_end    date NOT NULL,
  location    text NOT NULL,
  description text,
  map_config  jsonb,
  CONSTRAINT events_year_unique UNIQUE (year)
);

CREATE INDEX IF NOT EXISTS events_year_idx ON public.events (year DESC);

-- =============================================================================
-- TABLE: vendors
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  name              text NOT NULL,
  description       text,
  category          public.vendor_category,
  logo_url          text,
  website           text,
  instagram_handle  text,
  facebook_handle   text,
  tiktok_handle     text,
  email             text,
  phone             text,
  status            public.vendor_status NOT NULL DEFAULT 'pending',
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  map_position      jsonb,
  event_years       integer[]
);

CREATE INDEX IF NOT EXISTS vendors_status_idx     ON public.vendors (status);
CREATE INDEX IF NOT EXISTS vendors_user_id_idx    ON public.vendors (user_id);
CREATE INDEX IF NOT EXISTS vendors_category_idx   ON public.vendors (category);
-- Ensure one vendor row per auth user (prevents accidental dupes on approval).
CREATE UNIQUE INDEX IF NOT EXISTS vendors_user_id_unique ON public.vendors (user_id) WHERE user_id IS NOT NULL;

-- =============================================================================
-- TABLE: vendor_applications
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  vendor_name           text NOT NULL,
  contact_name          text NOT NULL,
  email                 text NOT NULL,
  phone                 text,
  business_description  text NOT NULL,
  category              public.vendor_category NOT NULL,
  website               text,
  social_links          jsonb NOT NULL DEFAULT '{}'::jsonb,
  status                public.application_status NOT NULL DEFAULT 'pending',
  reviewed_by           uuid REFERENCES auth.users(id),
  reviewed_at           timestamptz,
  notes                 text
);

CREATE INDEX IF NOT EXISTS vendor_applications_status_idx ON public.vendor_applications (status);
CREATE INDEX IF NOT EXISTS vendor_applications_email_idx  ON public.vendor_applications (email);

-- =============================================================================
-- TABLE: event_requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.event_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  vendor_id    uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  event_id     uuid NOT NULL REFERENCES public.events(id)  ON DELETE CASCADE,
  type         public.request_type NOT NULL,
  message      text,
  status       public.request_status NOT NULL DEFAULT 'pending',
  reviewed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS event_requests_vendor_idx  ON public.event_requests (vendor_id);
CREATE INDEX IF NOT EXISTS event_requests_event_idx   ON public.event_requests (event_id);
CREATE INDEX IF NOT EXISTS event_requests_status_idx  ON public.event_requests (status);

-- =============================================================================
-- TABLE: gallery
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gallery (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  storage_path   text NOT NULL,
  uploader_type  public.uploader_type NOT NULL,
  vendor_id      uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  event_id       uuid REFERENCES public.events(id)  ON DELETE SET NULL,
  caption        text,
  consent_given  boolean NOT NULL DEFAULT false,
  approved       boolean NOT NULL DEFAULT false,
  featured       boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS gallery_approved_idx  ON public.gallery (approved);
CREATE INDEX IF NOT EXISTS gallery_featured_idx  ON public.gallery (featured);
CREATE INDEX IF NOT EXISTS gallery_event_idx     ON public.gallery (event_id);

-- =============================================================================
-- ROW-LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery             ENABLE ROW LEVEL SECURITY;

-- ---------- events ----------
-- Everyone can read events (they're public info).
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "events: public read" ON public.events FOR SELECT TO anon, authenticated USING (true)';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Admins do whatever they want.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "events: admin all" ON public.events FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- ---------- vendors ----------
-- Public can read approved vendors only.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "vendors: public read approved" ON public.vendors FOR SELECT TO anon, authenticated USING (status = ''approved'' OR public.is_admin() OR user_id = auth.uid())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- A vendor can update their own row (but cannot change `status` — see CHECK).
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "vendors: self update" ON public.vendors FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Admins can do anything to any vendor row.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "vendors: admin all" ON public.vendors FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Prevent vendors from escalating their own status via UPDATE.
-- (Belt-and-suspenders alongside the policy above.)
CREATE OR REPLACE FUNCTION public.prevent_vendor_status_self_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change vendor status';
  END IF;
  RETURN NEW;
END;
$$;

DO $trig$ BEGIN
  CREATE TRIGGER vendors_status_guard
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW EXECUTE FUNCTION public.prevent_vendor_status_self_update();
EXCEPTION WHEN duplicate_object THEN NULL;
END $trig$;

-- ---------- vendor_applications ----------
-- Anyone (anon) can submit an application.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "applications: public insert" ON public.vendor_applications FOR INSERT TO anon, authenticated WITH CHECK (status = ''pending'')';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Applicants can read their own application by email match (allows
-- "check application status" by-email lookup; not used yet, but cheap).
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "applications: own read" ON public.vendor_applications FOR SELECT TO authenticated USING (email = auth.jwt() ->> ''email'' OR public.is_admin())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Admins do everything else.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "applications: admin all" ON public.vendor_applications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- ---------- event_requests ----------
-- Vendor can read their own requests.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "requests: vendor own read" ON public.event_requests FOR SELECT TO authenticated USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) OR public.is_admin())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Vendor can insert requests for themselves only.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "requests: vendor own insert" ON public.event_requests FOR INSERT TO authenticated WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()))';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Admins manage everything.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "requests: admin all" ON public.event_requests FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- ---------- gallery ----------
-- Public can read approved photos only.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "gallery: public read approved" ON public.gallery FOR SELECT TO anon, authenticated USING (approved = true OR public.is_admin())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Anyone can upload, but ONLY if they checked consent.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "gallery: insert with consent" ON public.gallery FOR INSERT TO anon, authenticated WITH CHECK (consent_given = true AND approved = false)';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Admins manage moderation.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "gallery: admin all" ON public.gallery FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('gallery',       'gallery',       true),
  ('vendor-logos',  'vendor-logos',  true)
ON CONFLICT (id) DO NOTHING;

-- Public read for both buckets (they're marked public above, but explicit policies don't hurt).
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "gallery bucket: public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = ''gallery'')';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "vendor-logos bucket: public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = ''vendor-logos'')';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Anyone can upload to the gallery bucket (with size & mimetype enforced server-side
-- when constructing the signed-upload URL, or at the API route).
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "gallery bucket: public insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = ''gallery'')';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Only authenticated vendors can upload to vendor-logos, and the path
-- must start with their user_id (e.g., "<auth.uid()>/logo.png").
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "vendor-logos bucket: vendor insert own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''vendor-logos'' AND (storage.foldername(name))[1] = auth.uid()::text)';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "vendor-logos bucket: vendor update own folder" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''vendor-logos'' AND (storage.foldername(name))[1] = auth.uid()::text)';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- Admins can manage all storage objects.
DO $pol$ BEGIN
  EXECUTE 'CREATE POLICY "storage: admin all" ON storage.objects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- =============================================================================
-- SEED DATA — current event so /map has something to render on first boot
-- =============================================================================
INSERT INTO public.events (year, name, date_start, date_end, location, description, map_config)
VALUES (
  EXTRACT(YEAR FROM CURRENT_DATE)::int,
  'Magic City Plant-A-Palooza ' || EXTRACT(YEAR FROM CURRENT_DATE)::text,
  CURRENT_DATE + INTERVAL '60 days',
  CURRENT_DATE + INTERVAL '60 days',
  'Birmingham, AL',
  'Birmingham''s annual outdoor plant festival.',
  jsonb_build_object('center', jsonb_build_array(-86.8025, 33.5186), 'zoom', 15)
)
ON CONFLICT (year) DO NOTHING;
