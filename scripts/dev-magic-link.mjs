#!/usr/bin/env node
/**
 * Generate a magic-link URL without sending email (dev only).
 * Use when Supabase returns "email rate limit exceeded" on /login.
 *
 * Usage (from project root, with .env.local loaded):
 *   set -a && source .env.local && set +a
 *   node scripts/dev-magic-link.mjs your@email.com
 *
 * Optional second arg: redirect path after login (default /admin/dashboard)
 */
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];
const next = process.argv[3] ?? '/admin/dashboard';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

if (!email) {
  console.error('Usage: node scripts/dev-magic-link.mjs <email> [next-path]');
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const redirectTo = `${siteUrl.replace(/\/$/, '')}/auth/callback?next=${encodeURIComponent(next)}`;

const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo },
});

if (error) {
  console.error('Failed:', error.message);
  process.exit(1);
}

// Extract token from response
const token = data?.properties?.hashed_token || data?.hashed_token;

if (!token) {
  console.error('No hashed_token in response:', JSON.stringify(data, null, 2));
  process.exit(1);
}

// Construct the callback URL directly (bypassing Supabase verify endpoint)
const callbackUrl = `${siteUrl.replace(/\/$/, '')}/auth/callback?token_hash=${token}&type=magiclink&next=${encodeURIComponent(next)}`;

console.log('\nOpen this URL in your browser (link expires in ~1 hour):\n');
console.log(callbackUrl);
console.log('\nNo email was sent.\n');
