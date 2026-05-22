import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types';

/**
 * Browser-side Supabase client. Use inside `'use client'` components only.
 *
 * Note: we let TypeScript INFER the return type rather than annotating it as
 * `SupabaseClient<Database>`. @supabase/ssr ≥ 0.5 returns a more specific
 * type carrying the PostgrestVersion extras, and the loose annotation makes
 * every typed query collapse to `never` downstream.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.local.example to .env.local and fill them in.'
    );
  }
  return createSupabaseBrowserClient<Database>(url, anon);
}
