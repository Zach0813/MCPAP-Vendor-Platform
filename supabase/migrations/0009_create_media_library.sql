-- =============================================================================
-- Create media library table for admin-managed images and videos
-- Supports featured carousel items and gallery display
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  featured BOOLEAN DEFAULT FALSE,
  featured_order INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for featured items and category filtering
CREATE INDEX IF NOT EXISTS media_featured_idx ON public.media(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS media_category_idx ON public.media(category);
CREATE INDEX IF NOT EXISTS media_created_by_idx ON public.media(created_by);

-- =============================================================================
-- Enable RLS and create policies
-- =============================================================================

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage media (create, read, update, delete)
CREATE POLICY "Admins can manage media"
  ON public.media
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow public read access (for gallery and carousel)
CREATE POLICY "Public can read media"
  ON public.media
  FOR SELECT
  USING (TRUE);

-- =============================================================================
-- Create storage buckets for media uploads
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', TRUE)
ON CONFLICT DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Admins can upload media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND public.is_admin()
  );

CREATE POLICY "Admins can update media files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'media'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'media'
    AND public.is_admin()
  );

CREATE POLICY "Admins can delete media files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'media'
    AND public.is_admin()
  );

CREATE POLICY "Public can read media files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

-- =============================================================================
-- Trigger to update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_media_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER media_updated_at
BEFORE UPDATE ON public.media
FOR EACH ROW
EXECUTE FUNCTION public.update_media_updated_at();
