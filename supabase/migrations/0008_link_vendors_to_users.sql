-- =============================================================================
-- Link vendors to user accounts via email
-- Ensures vendor profiles are accessible to logged-in vendor users
-- =============================================================================

-- Add user_id column to vendors table if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.vendors
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS vendors_user_id_idx ON public.vendors(user_id);

-- =============================================================================
-- Update sync trigger to link vendors to users by email
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_approved_application_to_vendor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendor_user_id UUID;
BEGIN
  IF NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  -- Only run when newly approved (or insert already approved).
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  -- Try to find a Supabase user with matching email
  SELECT id INTO vendor_user_id
  FROM auth.users
  WHERE email = NEW.email
  LIMIT 1;

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
      user_id = COALESCE(vendor_user_id, user_id),
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
      user_id,
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
      vendor_user_id,
      jsonb_build_object('lng', -86.8025, 'lat', 33.5186)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- Backfill: Link existing vendors to users by email
-- =============================================================================

UPDATE public.vendors v
SET user_id = u.id
FROM auth.users u
WHERE v.email = u.email
  AND v.user_id IS NULL;
