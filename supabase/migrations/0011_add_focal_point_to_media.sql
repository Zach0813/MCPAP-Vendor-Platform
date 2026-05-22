-- =============================================================================
-- Add focal_point column to media table for carousel pan/zoom positioning
-- =============================================================================

ALTER TABLE public.media
ADD COLUMN focal_point JSONB DEFAULT '{"x": 50, "y": 50}';

-- Add index for faster queries (though not critical for this use case)
CREATE INDEX IF NOT EXISTS media_focal_point_idx ON public.media USING gin(focal_point);
