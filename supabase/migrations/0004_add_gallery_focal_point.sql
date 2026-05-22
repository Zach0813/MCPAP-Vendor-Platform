-- =============================================================================
-- Add focal_point support to gallery table for featured image positioning
-- Migration: 0004_add_gallery_focal_point.sql
-- =============================================================================
-- This adds JSONB column to store focal point coordinates (x, y as percentages 0-100)
-- allowing admins to control where zoomed featured images focus on the carousel.

DO $$ BEGIN
  ALTER TABLE public.gallery
  ADD COLUMN focal_point jsonb DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Focal point structure: { "x": 50, "y": 50 } where x and y are percentages (0-100)
-- Default null means centered (50%, 50%)
