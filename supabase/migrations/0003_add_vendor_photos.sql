-- =============================================================================
-- Add photo columns to vendor_applications and vendors tables
-- Run in Supabase SQL Editor after 0001 and 0002
-- =============================================================================

-- Add photo columns to vendor_applications
DO $$ BEGIN
  ALTER TABLE public.vendor_applications
  ADD COLUMN logo_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.vendor_applications
  ADD COLUMN owner_photo_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.vendor_applications
  ADD COLUMN featured_photo_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add photo columns to vendors
DO $$ BEGIN
  ALTER TABLE public.vendors
  ADD COLUMN owner_photo_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.vendors
  ADD COLUMN featured_photo_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Note: vendors already has logo_url (logo_url is used by VendorPanel)
-- If logo_url doesn't exist in vendors, add it:
-- ALTER TABLE public.vendors ADD COLUMN logo_url TEXT;

-- =============================================================================
-- Create storage buckets for vendor photos with proper RLS
-- =============================================================================

-- Bucket: vendor-logos
-- Execute this in Supabase Storage:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-logos', 'vendor-logos', true);

-- Bucket: vendor-owner-photos
-- INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-owner-photos', 'vendor-owner-photos', true);

-- Bucket: vendor-product-photos
-- INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-product-photos', 'vendor-product-photos', true);

-- =============================================================================
-- RLS Policies for vendor photo buckets (allow authenticated uploads)
-- =============================================================================

-- For vendor-logos bucket
DO $pol$ BEGIN
  CREATE POLICY "Allow authenticated uploads to vendor-logos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'vendor-logos'
      AND auth.role() = 'authenticated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

DO $pol$ BEGIN
  CREATE POLICY "Allow public read of vendor-logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'vendor-logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- For vendor-owner-photos bucket
DO $pol$ BEGIN
  CREATE POLICY "Allow authenticated uploads to vendor-owner-photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'vendor-owner-photos'
      AND auth.role() = 'authenticated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

DO $pol$ BEGIN
  CREATE POLICY "Allow public read of vendor-owner-photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'vendor-owner-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- For vendor-product-photos bucket
DO $pol$ BEGIN
  CREATE POLICY "Allow authenticated uploads to vendor-product-photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'vendor-product-photos'
      AND auth.role() = 'authenticated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

DO $pol$ BEGIN
  CREATE POLICY "Allow public read of vendor-product-photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'vendor-product-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

-- =============================================================================
-- Update the 0002 trigger to copy photo URLs when approving applications
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_approved_application_to_vendor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  -- Only run when newly approved (or insert already approved).
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.vendors v WHERE v.email = NEW.email) THEN
    UPDATE public.vendors
    SET
      name = NEW.vendor_name,
      description = NEW.business_description,
      category = NEW.category,
      website = NEW.website,
      logo_url = COALESCE(NEW.logo_url, logo_url),
      owner_photo_url = COALESCE(NEW.owner_photo_url, owner_photo_url),
      featured_photo_url = COALESCE(NEW.featured_photo_url, featured_photo_url),
      instagram_handle = COALESCE(NEW.social_links ->> 'instagram', instagram_handle),
      facebook_handle = COALESCE(NEW.social_links ->> 'facebook', facebook_handle),
      tiktok_handle = COALESCE(NEW.social_links ->> 'tiktok', tiktok_handle),
      phone = NEW.phone,
      status = 'approved',
      map_position = COALESCE(
        map_position,
        jsonb_build_object('lng', -103.2317, 'lat', 45.7833)
      )
    WHERE email = NEW.email;
  ELSE
    INSERT INTO public.vendors (
      name,
      description,
      category,
      website,
      logo_url,
      owner_photo_url,
      featured_photo_url,
      instagram_handle,
      facebook_handle,
      tiktok_handle,
      email,
      phone,
      status,
      map_position
    ) VALUES (
      NEW.vendor_name,
      NEW.business_description,
      NEW.category,
      NEW.website,
      NEW.logo_url,
      NEW.owner_photo_url,
      NEW.featured_photo_url,
      NEW.social_links ->> 'instagram',
      NEW.social_links ->> 'facebook',
      NEW.social_links ->> 'tiktok',
      NEW.email,
      NEW.phone,
      'approved',
      jsonb_build_object('lng', -103.2317, 'lat', 45.7833)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill existing approved applications that don't have corresponding vendor rows
INSERT INTO public.vendors (
  name,
  description,
  category,
  website,
  logo_url,
  owner_photo_url,
  featured_photo_url,
  instagram_handle,
  facebook_handle,
  tiktok_handle,
  email,
  phone,
  status,
  map_position
)
SELECT
  a.vendor_name,
  a.business_description,
  a.category,
  a.website,
  a.logo_url,
  a.owner_photo_url,
  a.featured_photo_url,
  a.social_links ->> 'instagram',
  a.social_links ->> 'facebook',
  a.social_links ->> 'tiktok',
  a.email,
  a.phone,
  'approved',
  jsonb_build_object('lng', -103.2317, 'lat', 45.7833)
FROM public.vendor_applications a
WHERE a.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM public.vendors v WHERE v.email = a.email
  )
ON CONFLICT DO NOTHING;
