-- =============================================================================
-- Fix: Allow unauthenticated uploads to vendor photo storage buckets
-- The application form is public, so we need to allow uploads without auth
-- =============================================================================

-- Drop old authenticated-only policies
DROP POLICY IF EXISTS "Allow authenticated uploads to vendor-logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to vendor-owner-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to vendor-product-photos" ON storage.objects;

-- =============================================================================
-- Create new policies allowing unauthenticated uploads
-- =============================================================================

-- For vendor-logos bucket
DO $pol$ BEGIN
  CREATE POLICY "Allow uploads to vendor-logos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'vendor-logos');
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
  CREATE POLICY "Allow uploads to vendor-owner-photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'vendor-owner-photos');
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
  CREATE POLICY "Allow uploads to vendor-product-photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'vendor-product-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;

DO $pol$ BEGIN
  CREATE POLICY "Allow public read of vendor-product-photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'vendor-product-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $pol$;
