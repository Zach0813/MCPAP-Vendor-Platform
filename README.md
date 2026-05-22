# Magic City Plant-A-Palooza — Website

Full-stack event platform built with Next.js 16 (App Router) + Supabase + Mapbox.
Replaces the legacy Flask/Python vendor map with a mobile-first, accessible,
production-grade site.

---

## Tech stack

- **Framework:** Next.js 16, App Router, TypeScript, Tailwind CSS
- **Backend / DB / Auth / Storage:** Supabase (Postgres, Auth, Storage, Realtime)
- **Hosting:** Vercel
- **Map:** Mapbox GL JS via `react-map-gl`
- **Email:** Resend
- **Social feed:** Curator.io embed
- **Forms:** `react-hook-form` + `zod`

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# …then fill in real values from each service (see below)

# 3. Run the dev server
npm run dev
# → http://localhost:3000
```

You will see Tailwind-styled pages render even with empty Supabase/Mapbox
credentials. The map and data-driven pages show friendly “needs configuration”
states until you connect each service.

### Useful scripts

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Next.js dev server with hot reload        |
| `npm run build`    | Production build                          |
| `npm run start`    | Run the production build                  |
| `npm run lint`     | ESLint                                    |
| `npm run type-check` | TypeScript checks (no emit)             |
| `npm run format`   | Prettier on the whole repo                |

---

## Service account setup

You need four external services. Free tiers cover everything except large-scale
Mapbox / Resend usage.

### 1. Supabase — *required*

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. From **Project Settings → API Keys**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Legacy tab → "anon" public key** (the JWT starting with `eyJ`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     *Don't use the new `sb_publishable_...` style — this app uses the legacy JWT anon key.*
   - **Legacy tab → service_role key** (also a JWT, SECRET) → `SUPABASE_SERVICE_ROLE_KEY`
3. Apply the migrations IN ORDER from `supabase/migrations/`:
   - `0001_initial_schema.sql` — tables, enums, RLS, storage buckets, seed event.
   - `0002_sync_approved_vendors.sql` — Postgres trigger that auto-creates the
     `vendors` row when an application's status flips to `approved`, plus a
     backfill for any approved apps that don't already have a vendor row.
   - Paste each into **SQL Editor → Run**, or with the [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase link` then `supabase db push`.
4. Promote yourself to admin (so you can access `/admin`):
   - Sign in once at `/login` (magic link) so your account exists in **Supabase Auth** (`auth.users` — not a table in `0001_initial_schema.sql`).
   - Open `supabase/scripts/promote-admin.sql`, change the email to yours, paste it into the SQL Editor, and run.
   - Sign out and sign in again, then visit `/admin`.

#### Hitting Supabase's email rate limit?

The hosted Supabase free tier caps magic-link emails to a few per hour per address.
If you blow through that while testing, use the dev helper to mint a magic-link URL
without sending email:

```bash
set -a && source .env.local && set +a
node scripts/dev-magic-link.mjs your@email.com /admin/dashboard
```

Open the printed URL in your browser. Same effect as clicking the email link.

### 2. Mapbox — *required for the map page*

1. [Sign up](https://account.mapbox.com/auth/signup/) and create a **public** access token.
2. Token scopes: `styles:read`, `fonts:read`, `datasets:read` (default scopes are fine).
3. Copy the `pk.*` token → `NEXT_PUBLIC_MAPBOX_TOKEN`.

### 3. Resend — *required for application emails*

1. [resend.com/api-keys](https://resend.com/api-keys) → create an API key.
2. Verify a sending domain (or use the default Resend sandbox in dev).
3. Copy the key → `RESEND_API_KEY`.
4. Set `ORGANIZER_EMAIL` to the address that should receive new application notifications.

### 4. Curator.io — *optional, for the /feed page*

1. [app.curator.io](https://app.curator.io/) → create a free feed → connect your social accounts.
2. Copy the feed ID → `NEXT_PUBLIC_CURATOR_FEED_ID`.
3. Without this, `/feed` shows a friendly “not yet configured” message — site still runs.

---

## Project structure

```
app/
  (public)/              Public site — no auth required
    page.tsx             Home / hero
    map/                 Interactive vendor map
    vendors/             Vendor directory
    gallery/             Photo gallery
    feed/                Curator social feed
    faq/                 FAQ
  vendor/                Vendor portal (auth gated)
    dashboard/
    profile/
    requests/
  admin/                 Organizer admin (admin role required)
    dashboard/
    applications/
    vendors/
    gallery/
  apply/                 Public application form
  auth/
    callback/            Supabase magic-link callback
    signout/             POST → sign out
  api/
    applications/        Submit + approve/reject endpoints

components/
  ui/                    Button, Input, Modal, StatusBadge, StatCard…
  map/                   MapView, VendorPanel, CategoryFilter
  gallery/               MasonryGrid, UploadButton, UploadForm
  vendor/                ApplicationForm, ProfileForm, RequestList…
  admin/                 ApplicationsTable, VendorsAdminTable…
  auth/                  LoginForm
  nav/                   PortalLinks (vendor/admin entry points)
  CuratorFeed.tsx        Curator.io social feed embed

lib/
  supabase/
    client.ts            createBrowserClient — for 'use client' components
    server.ts            createServerClient (async) + createAdminClient — server-only
  supabase.ts            Legacy entry point — re-exports createBrowserClient
  mapbox.ts              Mapbox config + default viewport
  auth.ts                isAdmin(user) helper (JWT custom claim)
  utils.ts               cn() — Tailwind class merger
  gallery-url.ts         Client-safe public URL builder for gallery photos
  data/
    vendors.ts           Typed server-side data accessors
    gallery.ts
  validation/
    application.ts       Zod schema shared by client form + API route

types/
  index.ts               App types + the `Database` type for typed Supabase client

supabase/
  migrations/
    0001_initial_schema.sql        Tables, RLS, storage buckets, seed event
    0002_sync_approved_vendors.sql Trigger: app approved → vendor row auto-synced
  scripts/
    promote-admin.sql              Mark a user as admin (run after first login)

scripts/
  dev-magic-link.mjs     Mint a magic-link URL without sending email (dev only)

middleware.ts            Refreshes Supabase auth cookie on every request
```

---

### A note on the spec's route group syntax

The original brief used `(vendor)` and `(admin)` as folder names (Next.js route
groups). In Next.js App Router, parens mean the folder is excluded from the URL —
so `(vendor)/dashboard` and `(admin)/dashboard` would both try to serve `/dashboard`
and collide at build time. The fix: real folder names (`vendor/`, `admin/`) so the
URLs are `/vendor/dashboard` and `/admin/dashboard` as the spec actually intends.
The public group remains a route group `(public)` because its routes (`/map`,
`/vendors`, etc.) don't collide.

---

## Architecture notes

- **Auth flow:** Magic-link only. No passwords. Vendors get invited on
  application approval; admins are tagged by hand via the SQL snippet above.
- **Authorization:** Row-Level Security on every table. The `is_admin()` SQL
  function reads `app_metadata.role` from the JWT, so admin checks happen
  in Postgres — not just in the UI.
- **Server vs. client components:** Data fetching lives in Server Components
  via `await createServerClient()` from `@/lib/supabase/server`. Mutations from
  the browser use `createBrowserClient()` from `@/lib/supabase/client`.
  Anything that needs to bypass RLS (e.g., linking a vendor row to its auth
  user after approval) uses `createAdminClient()` — server-only, inside route
  handlers. The `server.ts` module is marked `import 'server-only'` so
  importing it from a client component fails fast at build time instead of
  leaking your service-role key.
- **Application → vendor sync:** Approval doesn't INSERT into `vendors` from
  the API route. The `sync_approved_application_to_vendor` trigger
  (migration 0002) does the INSERT/UPDATE in the database the moment the
  application's status flips to `approved`. The API route then UPDATEs the
  trigger-created row to set `user_id` after inviting the user. This means
  if you ever flip a row's status in SQL Studio by hand, the vendor row
  still appears — no manual sync needed.
- **Accessibility:**
  - 44px minimum touch targets via `min-h-touch` Tailwind utility.
  - Skip-link, focus-visible rings, semantic `<label>` everywhere.
  - Color contrast meets WCAG AA on all defined palette pairs.
  - Reduced-motion users get instant transitions.
- **Mobile-first:** Map detail uses a bottom sheet on small viewports, sidebar
  on `sm:` and up. All forms stack on mobile.

---

## Deployment

1. Push to GitHub.
2. Import the repo into [Vercel](https://vercel.com/new).
3. Add all environment variables from `.env.local` to the Vercel project.
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
5. Deploy. Supabase migrations run on your Supabase project independently of Vercel.

In Supabase, add your Vercel domain to **Authentication → URL Configuration → Redirect URLs**:
- `https://your-domain.com/auth/callback`
- `https://your-domain.com/vendor/dashboard`

---

## What's stubbed and what's done

| Feature                              | Status |
| ------------------------------------ | :----: |
| Folder structure, configs, types     | ✅     |
| Tailwind theme + accessibility base  | ✅     |
| Supabase clients (browser/server/admin) | ✅  |
| Auth: login, callback, signout       | ✅     |
| Public home, FAQ, feed, vendors      | ✅     |
| Map with Mapbox GL + filter + panel  | ✅     |
| Gallery with masonry + upload modal  | ✅     |
| Vendor application form (Zod)        | ✅     |
| Vendor portal: dashboard/profile/requests | ✅ |
| Admin: applications, vendors, gallery moderation | ✅ |
| API: app submit + approve/reject + emails | ✅ |
| Initial Supabase migration + RLS + buckets | ✅ |
| 0002 trigger — app approval auto-creates vendor | ✅ |
| Dev tools: magic-link minter, promote-admin SQL | ✅ |
| Cloudinary integration (optional)    | ⚪ Not yet — see `next.config.js` `remotePatterns` |
| Mapbox custom style                  | ⚪ Using `light-v11`; swap in your Studio style URL |
| Realtime subscriptions               | ⚪ Future enhancement |

---

## License

Internal project for Magic City Plant-A-Palooza. All rights reserved.
