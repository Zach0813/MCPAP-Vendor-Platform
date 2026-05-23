import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Supabase auth callback for magic links (email OTP and admin-generated links).
 * Handles both PKCE (`code`) and implicit (`token_hash` + `type`) redirect styles.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Use server-side SITE_URL, fall back to NEXT_PUBLIC_SITE_URL, then hardcoded production URL
  const origin =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://mcpap-dev.thelancave.net';
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash') || searchParams.get('token');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = normalizeNextPath(searchParams.get('next'));

  const supabase = await createServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirectLogin(origin, error.message);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return redirectLogin(origin, error.message);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return redirectLogin(
    origin,
    'Sign-in link is incomplete or expired. Generate a fresh link with: node scripts/dev-magic-link.mjs your@email.com'
  );
}

function normalizeNextPath(raw: string | null): string {
  const fallback = '/vendor/dashboard';
  if (!raw) return fallback;
  try {
    const decoded = decodeURIComponent(raw);
    return decoded.startsWith('/') ? decoded : fallback;
  } catch {
    return raw.startsWith('/') ? raw : fallback;
  }
}

function redirectLogin(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
}
