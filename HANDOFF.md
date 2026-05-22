# MCPAP Website — Session Handoff

> Paste-ready briefing for a new chat. Optimized for resuming the project with a smaller model.
> Last updated: 2026-05-19 by the previous session.

---

## TL;DR — what this project is

**Magic City Plant-A-Palooza event website.** Public-facing event info + vendor portal (auth gated) + organizer admin. Replaces a legacy Flask/Python vendor map. Mobile-first, accessible, deployed to Vercel.

Location on disk: `/Users/zlesniewski/Documents/Visual Studio Code/MCPAP Website`

---

## Tech stack — versions are exact and intentional

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | `^16.2.6` |
| Styling | Tailwind CSS v3 | `^3.4.7` |
| DB / Auth / Storage | Supabase (Postgres + Auth + Storage) | `@supabase/supabase-js@^2.106.0` |
| Supabase SSR helper | `@supabase/ssr` | `^0.10.3` |
| Map | Mapbox GL JS via `react-map-gl` | `^3.6.0` |
| Email | Resend | `^4.0.0` |
| Social feed | Curator.io embed | — |
| Forms | `react-hook-form` + `zod` | `^7.53.0` / `^3.23.8` |
| Lint | ESLint **9** + flat config | `^9.0.0` |
| Hosting target | Vercel | — |

**Don't mix-and-match:** `@supabase/ssr` < 0.10 ships incompatible types with `supabase-js` 2.55+. `eslint-config-next@16` requires `eslint@>=9`.

---

## Project structure

```
app/
  (public)/                  Route group — URLs are /, /map, /vendors, /gallery, /feed, /faq
    layout.tsx               Site header (PortalLinks shows admin/vendor entry if logged in) + footer
    page.tsx                 Home
    map/page.tsx             Mapbox vendor map
    vendors/page.tsx         Directory list
    gallery/page.tsx         Masonry grid + UploadButton
    feed/page.tsx            Curator embed
    faq/page.tsx             Accordion FAQ
  vendor/                    REAL folder, not a route group → URLs are /vendor/*
    layout.tsx               Auth gate (redirects to /login)
    dashboard/page.tsx
    profile/page.tsx
    requests/page.tsx
  admin/                     REAL folder → URLs are /admin/*. Admin gate (isAdmin JWT check)
    layout.tsx
    dashboard/page.tsx       Stat cards (pending apps, approved vendors, etc.)
    applications/page.tsx    Approve/reject UI
    vendors/page.tsx         Status management
    gallery/page.tsx         Photo moderation
  apply/page.tsx             Public vendor application form
  auth/
    callback/route.ts        Magic link callback (PKCE + OTP both supported)
    signout/route.ts         POST → sign out
  login/page.tsx
  api/applications/
    route.ts                 POST = submit application (public, Zod-validated)
    [id]/approve/route.ts    POST = admin approves (writes user_id, trigger handles vendor row)
    [id]/reject/route.ts     POST = admin rejects + emails applicant

components/
  ui/         Button, Input, Textarea, Modal, StatusBadge, StatCard
  map/        MapView (mapbox-gl), VendorPanel, CategoryFilter
  gallery/    MasonryGrid, UploadButton, UploadForm
  vendor/     ApplicationForm, ProfileForm, RequestList, NewRequestForm
  admin/      ApplicationsTable, VendorsAdminTable, GalleryModerationGrid
  auth/       LoginForm
  nav/        PortalLinks   (vendor/admin entry shown on auth)
  CuratorFeed.tsx

lib/
  supabase/
    client.ts     createBrowserClient — for 'use client' components
    server.ts     createServerClient (async, awaited) + createAdminClient — server-only
  supabase.ts     Re-exports createBrowserClient — legacy entry point
  mapbox.ts       Token + default viewport (Birmingham, AL: -86.8025, 33.5186)
  auth.ts         isAdmin(user) — reads app_metadata.role OR user_metadata.role
  utils.ts        cn() — clsx + tailwind-merge
  gallery-url.ts  Client-safe public URL builder (extracted so client components don't pull server-only code)
  data/
    vendors.ts    getApprovedVendors, getApprovedVendorsForMap
    gallery.ts    getApprovedGallery
  validation/
    application.ts  Zod schema shared between form and API route

types/
  index.ts        All app types + Database type (typegen-shaped)
  __diag.ts       Inert stub. Safe to delete manually from VS Code (sandbox unlink was blocked).

supabase/
  migrations/
    0001_initial_schema.sql        Tables, enums, RLS, storage buckets, seed event
    0002_sync_approved_vendors.sql Trigger: application.status='approved' → upserts vendors row
  scripts/
    promote-admin.sql              Mark a user as admin (edit email before running)

scripts/
  dev-magic-link.mjs               node ./this your@email.com [/redirect/path]
                                   Mints a magic-link URL via admin API — bypasses email rate limit

middleware.ts                       Refreshes Supabase auth cookie on every request (getAll/setAll API)
tailwind.config.ts                  Plant-themed palette: sage/terracotta/cream + 44px touch targets
eslint.config.mjs                   ESLint 9 flat config (next/core-web-vitals + next/typescript)
```

---

## Current status

- `npm run type-check` → **clean** (0 errors)
- `npm run lint` → **clean** (0 errors, 0 warnings)
- All scaffold files exist and compile
- Migrations 0001 and 0002 are ready to apply

**What's working out of the box:**
- All pages render with friendly "needs configuration" empty states even without API keys
- Magic-link login + auth gating on /vendor/* and /admin/*
- Vendor application form → API → DB (with Resend emails)
- Admin approve flow: application.status='approved' → 0002 trigger inserts vendor row → API route updates user_id → applicant gets invitation email
- Gallery upload modal with consent checkbox
- Mapbox map with category filter and bottom-sheet/sidebar vendor detail

**What's stubbed (no work done yet):**
- Custom Mapbox style — using `light-v11`
- Cloudinary image pipeline — `next.config.js` already whitelists the domain
- Realtime subscriptions
- Mobile menu drawer (uses `<details>` for now — TODO comment in `(public)/layout.tsx`)
- Vendor map_position editor (admin has no UI to set lat/lng yet — trigger inserts a default Birmingham pin)
- 404/error analytics piping (the `error.tsx` has a `// TODO: pipe to Sentry`)

---

## Critical gotchas — read these before touching anything

1. **All entity types use `type`, NOT `interface`.** `interface Vendor {}` does not satisfy `Record<string, unknown>` because declaration merging means TS can't prove it. The Supabase `Database` type requires this — using interfaces silently collapses every typed query to `never[]`. If you see "Property X does not exist on type 'never'" — check that the row type is a `type`, not `interface`.

2. **`(vendor)` and `(admin)` are real folders, not route groups.** In Next.js App Router, parens-folders are excluded from the URL. The original spec wrote `(vendor)/dashboard`, but that would collide with `(admin)/dashboard` (both would serve `/dashboard`). Real folders → URLs match `/vendor/dashboard` and `/admin/dashboard` as intended. `(public)` is still a route group — it works because its children (`/map`, `/vendors`, etc.) don't collide.

3. **`createServerClient` is async.** `lib/supabase/server.ts` exports `async function createServerClient()`. Always `await` it. The `server.ts` module has `import 'server-only'` at the top — importing it from a client component is a build-time error (not runtime).

4. **The 0002 migration's trigger creates vendor rows automatically.** When an admin approves an application (UPDATE `vendor_applications` SET status='approved'), a trigger inserts or updates the matching `vendors` row by email. The `/api/applications/[id]/approve/route.ts` does NOT insert; it only updates `user_id` on the trigger-created row. If you ever add a manual vendor-row INSERT to that flow, you'll create duplicates.

5. **Supabase env keys are JWTs (legacy tab), not the new `sb_publishable_...` keys.** This app uses the legacy anon JWT. See `.env.local.example` notes.

6. **ESLint 9 flat config.** `.eslintrc.json` is ignored; the real config is `eslint.config.mjs`. Don't add rules to the JSON file.

7. **Service-role client never goes to the browser.** `createAdminClient()` lives in `lib/supabase/server.ts` next to `import 'server-only'`. Only import it inside Route Handlers / Server Actions.

---

## Service account setup checklist

1. **Supabase** — create project. Apply `0001_initial_schema.sql` then `0002_sync_approved_vendors.sql` in SQL Editor. Add Vercel domain to Authentication → URL Configuration → Redirect URLs.
2. **Mapbox** — create public token (`pk.*`) with default scopes.
3. **Resend** — create API key, verify a sending domain (or use sandbox in dev).
4. **Curator.io** — optional. Create feed, copy feed ID. Without it, /feed shows a friendly placeholder.
5. **Promote yourself to admin** — sign in once at `/login`, then edit `supabase/scripts/promote-admin.sql` (change the email) and run in SQL Editor. Sign out and back in.
6. **Hit Supabase's email rate limit?** Use `node scripts/dev-magic-link.mjs your@email.com /admin/dashboard` — bypasses email entirely.

---

## Suggested next-step priorities

Ranked by user-value-per-effort. Pick whichever looks most appealing.

1. **Real branding pass.** Replace the placeholder sage/terracotta palette in `tailwind.config.ts` with the actual MCPAP brand colors. Drop in logo files (recommended: `public/logo.svg`, used in `(public)/layout.tsx` and `app/layout.tsx` metadata). Tweak Inter/Fraunces fonts if there's a stronger pairing.

2. **Map pin editor for admin.** Currently the 0002 trigger drops every approved vendor at the same Birmingham coords. Build a drag-pin admin UI on `/admin/vendors/[id]` so organizers can position each booth on the map. State changes write to `vendors.map_position` (jsonb).

3. **Replace the `<details>` mobile menu** in `app/(public)/layout.tsx` with a proper drawer (with focus trap and Escape-to-close). The existing TODO points to this.

4. **Cloudinary upgrade path.** Right now gallery photos and vendor logos go to Supabase Storage. The infrastructure for swapping to Cloudinary is in `next.config.js`'s `remotePatterns`. Worth doing when image volume grows.

5. **About / sponsors / past-years pages.** Pure content additions. New folders under `app/(public)/`.

6. **Vendor-side enhancements** — booth photo upload directly from vendor portal, multi-photo galleries per vendor, time-of-day map (e.g., where to be at noon).

7. **Realtime application notifications.** When a new application lands, the admin dashboard's stat cards should bump in real time. Use Supabase Realtime channel on `vendor_applications`.

8. **Tests.** No test infrastructure yet. Vitest + React Testing Library is the lightest setup; Playwright for the auth flow E2E.

---

## How to brief the next session

Paste this entire file into the new chat as the first message. Add anything new you want to focus on. Suggested opener:

> Here's the handoff doc for my Magic City Plant-A-Palooza website. The previous session got it scaffolded and type-clean. Today I want to [your goal]. Read the gotchas section before suggesting changes.

That should give the new model enough context to pick up cleanly without burning tokens on re-discovery.

---

## File locations (absolute paths, in case the next session needs them)

- Project root: `/Users/zlesniewski/Documents/Visual Studio Code/MCPAP Website`
- Scratch outputs (Cowork temp): `~/Library/Application Support/Claude/local-agent-mode-sessions/...`

The project root is the only place that matters — everything in scratch is ephemeral.
