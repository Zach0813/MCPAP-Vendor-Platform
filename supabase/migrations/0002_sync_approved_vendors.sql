-- =============================================================================
-- Sync approved vendor applications → vendors table + default map pins
-- Run in Supabase SQL Editor after 0001_initial_schema.sql
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

DROP TRIGGER IF EXISTS vendor_applications_sync_vendor ON public.vendor_applications;
CREATE TRIGGER vendor_applications_sync_vendor
  AFTER INSERT OR UPDATE OF status ON public.vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_approved_application_to_vendor();

-- Backfill: approved applications that never created a vendors row
INSERT INTO public.vendors (
  name,
  description,
  category,
  website,
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
  a.social_links ->> 'instagram',
  a.social_links ->> 'facebook',
  a.social_links ->> 'tiktok',
  a.email,
  a.phone,
  'approved',
  jsonb_build_object('lng', -86.8025, 'lat', 33.5186)
FROM public.vendor_applications a
WHERE a.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM public.vendors v WHERE v.email = a.email
  );

-- Approved vendors without coordinates get a default Birmingham pin
UPDATE public.vendors
SET map_position = jsonb_build_object('lng', -86.8025, 'lat', 33.5186)
WHERE status = 'approved'
  AND (
    map_position IS NULL
    OR map_position ->> 'lng' IS NULL
    OR map_position ->> 'lat' IS NULL
  );
