-- =============================================================================
-- Expand focal_point JSONB to include zoom level and video start time
-- =============================================================================

-- Update existing focal_point values to include zoom and videoTime if not present
UPDATE public.media
SET focal_point = jsonb_set(
  CASE
    WHEN focal_point IS NULL THEN '{"x": 50, "y": 50, "zoom": 1, "videoTime": 0}'::jsonb
    WHEN focal_point ? 'zoom' THEN focal_point
    ELSE jsonb_set(jsonb_set(focal_point, '{zoom}', '1'), '{videoTime}', '0')
  END,
  '{zoom}',
  COALESCE((focal_point->>'zoom')::text, '1')::jsonb
)
WHERE focal_point IS NOT NULL OR focal_point IS NULL;

-- Update default value for new records
ALTER TABLE public.media
ALTER COLUMN focal_point SET DEFAULT '{"x": 50, "y": 50, "zoom": 1, "videoTime": 0}';
