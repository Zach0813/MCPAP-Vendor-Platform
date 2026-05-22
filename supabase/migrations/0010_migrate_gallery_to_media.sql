-- =============================================================================
-- Migrate existing gallery images to new media table
-- Maps old gallery table structure to new media table
-- =============================================================================

INSERT INTO public.media (
  id,
  file_url,
  media_type,
  title,
  description,
  category,
  featured,
  featured_order,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  storage_path AS file_url,  -- Temporarily store path; will be updated with full URL
  'image' AS media_type,
  COALESCE(caption, 'Gallery image') AS title,
  NULL AS description,
  'gallery' AS category,
  COALESCE(featured, false) AS featured,
  CASE WHEN featured = true THEN ROW_NUMBER() OVER (ORDER BY created_at DESC) ELSE NULL END AS featured_order,
  created_at,
  NOW()
FROM public.gallery
WHERE storage_path IS NOT NULL AND approved = true
ON CONFLICT DO NOTHING;
