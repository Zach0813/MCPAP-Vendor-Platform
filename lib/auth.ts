import type { User } from '@supabase/supabase-js';

/**
 * Admin role is stored as a custom claim on auth.users.
 * The migration sets `raw_app_meta_data->>'role' = 'admin'` for admin users.
 * Client-side reads `app_metadata.role` from the JWT.
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  return role === 'admin';
}
