-- =============================================================================
-- Add storage_formats field to track which file formats exist on the server
-- =============================================================================

ALTER TABLE public.media
ADD COLUMN storage_formats TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Set initial formats based on existing media_type
-- Videos default to mp4, images default to their original format
UPDATE public.media
SET storage_formats = ARRAY['mp4']
WHERE media_type = 'video' AND storage_formats = ARRAY[]::TEXT[];

-- For images, we'll just track 'image' for now (admin can update specifics)
UPDATE public.media
SET storage_formats = ARRAY['image']
WHERE media_type = 'image' AND storage_formats = ARRAY[]::TEXT[];

-- Add comment explaining the field
COMMENT ON COLUMN public.media.storage_formats IS
'Array of file formats available on storage server (e.g., [''mp4'', ''webm''] for videos that have both formats)';
