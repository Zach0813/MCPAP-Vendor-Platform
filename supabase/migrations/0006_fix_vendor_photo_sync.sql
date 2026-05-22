-- =============================================================================
-- Fix: Ensure vendor photos are properly synced when applications are approved
-- This migration guarantees photo columns exist and the sync trigger includes them
-- =============================================================================

-- Ensure photo columns exist on vendor_applications table
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

-- Ensure photo columns exist on vendors table
DO $$ BEGIN
  ALTER TABLE public.vendors
  ADD COLUMN logo_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

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

-- =============================================================================
-- Update the sync trigger to include photo URLs
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
        jsonb_build_object('lng', -86.8025, 'lat', 33.5186)
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
      jsonb_build_object('lng', -86.8025, 'lat', 33.5186)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- Backfill: Sync photos from vendor_applications to vendors for existing
-- approved applications that may not have photos synced yet
-- =============================================================================

UPDATE public.vendors v
SET
  logo_url = COALESCE(v.logo_url, a.logo_url),
  owner_photo_url = COALESCE(v.owner_photo_url, a.owner_photo_url),
  featured_photo_url = COALESCE(v.featured_photo_url, a.featured_photo_url)
FROM public.vendor_applications a
WHERE v.email = a.email
  AND a.status = 'approved'
  AND (
    v.logo_url IS NULL
    OR v.owner_photo_url IS NULL
    OR v.featured_photo_url IS NULL
  );
