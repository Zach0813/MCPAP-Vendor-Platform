-- =============================================================================
-- Promote a user to admin
-- =============================================================================
-- This project does NOT have a public.users table in 0001_initial_schema.sql.
-- Logins are stored by Supabase Auth in auth.users (built-in, always there).
--
-- You must sign in on the site at least once (magic link) BEFORE running this,
-- or auth.users will have no row for your email.
--
-- Steps:
--   1. Visit http://localhost:3000/login and complete magic-link sign-in.
--   2. Replace the email below with the same address you used.
--   3. Run this entire file in Supabase → SQL Editor → Run.
--   4. Sign out on the site, sign in again, then open /admin
--
-- Optional: Supabase Dashboard → Authentication → Users (same data, UI only).
-- =============================================================================

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'pixelplantco@gmail.com';

-- Verify (should show "role": "admin" inside raw_app_meta_data):
SELECT id, email, raw_app_meta_data
FROM auth.users
WHERE email = 'pixelplantco@gmail.com';
