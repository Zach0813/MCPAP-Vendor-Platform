-- Migration: Add event details columns (address, pin location, event times, contact info)
-- Purpose: Simplify event configuration page with core essentials

DO $$ BEGIN
  ALTER TABLE public.events
  ADD COLUMN address TEXT DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.events
  ADD COLUMN pin_location JSONB DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.events
  ADD COLUMN event_times JSONB DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.events
  ADD COLUMN contact_info JSONB DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- pin_location: { lat: number, lng: number }
-- event_times: { "YYYY-MM-DD": { start: "HH:MM", end: "HH:MM" }, ... }
-- contact_info: { phone?: string, email?: string, website?: string, instagram?: string, facebook?: string, tiktok?: string, notes?: string }
