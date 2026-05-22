import 'server-only';

import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types';

/**
 * Server-side Supabase clients.
 *
 *   createServerClient()  → Server Components / Route Handlers / Server Actions.
 *                           Async because `next/headers`'s `cookies()` is async in Next 15+.
 *   createAdminClient()   → Bypasses RLS. Use ONLY inside route handlers / server actions
 *                           for elevated operations (admin-approving applications, etc).
 *
 * Validation lives inside each function so TypeScript can narrow
 * `string | undefined` env vars before passing them to the Supabase factory.
 */

type CookieToSet = { name: string; value: string; options: CookieOptions };

function readPublicEnv(): { url: string; anon: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.local.example to .env.local and fill them in.'
    );
  }
  return { url, anon };
}

/**
 * For Server Components, Server Actions, and Route Handlers.
 * Return type is inferred — see comment in client.ts for the why.
 */
export async function createServerClient() {
  const { url, anon } = readPublicEnv();
  const cookieStore = await cookies();
  return createSupabaseServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method can throw when called from a Server Component.
          // Cookie refresh in that case is handled by middleware.ts.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS. SERVER-ONLY.
 * Never import this file from a client component — `import 'server-only'` will catch it.
 */
export function createAdminClient() {
  const { url } = readPublicEnv();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY — required for admin operations.');
  }
  return createSupabaseClient<Database>(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
