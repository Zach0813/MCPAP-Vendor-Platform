import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Proxy (formerly known as middleware in Next ≤15) — refreshes the Supabase
 * auth cookie on every request so Server Components can call
 * `supabase.auth.getUser()` and get a fresh session.
 *
 * Next 16 renamed the convention from `middleware.ts` / `middleware()` to
 * `proxy.ts` / `proxy()`. The API and behavior are otherwise identical.
 * See: https://nextjs.org/docs/messages/middleware-to-proxy
 *
 * Uses the canonical @supabase/ssr `getAll` / `setAll` cookie adapter —
 * the same shape as `lib/supabase/server.ts`. The `get` / `set` / `remove`
 * trio is deprecated in @supabase/ssr ≥ 0.5.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // IMPORTANT: do NOT run code between `createServerClient` and `getUser` —
  // anything that touches cookies before the refresh runs risks a stale session.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *   - _next/static (static files)
     *   - _next/image (image optimization)
     *   - favicon.ico
     *   - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
