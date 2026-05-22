# Photo Uploads Implementation — Setup Guide

## Overview

Vendors can now upload three types of photos during application and profile editing:

1. **Business Logo** — Square format, shown on vendor list and map
2. **Owner/Operator Photo** — Portrait photo for credibility
3. **Featured Product Photo** — Best product or booth setup

---

## What's Been Implemented

### Components
- `components/vendor/ImageUploadField.tsx` — Reusable upload component with preview
- Updated `components/vendor/ApplicationForm.tsx` — Photo section added
- Updated `components/vendor/ProfileForm.tsx` — Photo uploads for approved vendors

### Database
- Updated `types/index.ts` — Added photo URL fields
- Created `supabase/migrations/0003_add_vendor_photos.sql` — Migration script

### Backend
- Updated `/api/applications` — Accepts and stores photo URLs
- Existing vendor profile update works with new fields

---

## Setup Steps (Required)

### Step 1: Run the Database Migration

1. Go to **Supabase Dashboard** → SQL Editor
2. Copy the entire contents of `supabase/migrations/0003_add_vendor_photos.sql`
3. Paste into the SQL Editor
4. Click **Run**

This will:
- Add photo columns to `vendor_applications` table
- Add photo columns to `vendors` table
- Update the approval trigger to copy photos when approving

### Step 2: Create Storage Buckets

In Supabase Dashboard → Storage, manually create three buckets (or use SQL):

**Option A: Via Dashboard**
1. Click **New Bucket**
2. Create bucket named: `vendor-logos` (set public: ON)
3. Repeat for: `vendor-owner-photos` and `vendor-product-photos`

**Option B: Via SQL**
Execute this in the SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('vendor-logos', 'vendor-logos', true),
  ('vendor-owner-photos', 'vendor-owner-photos', true),
  ('vendor-product-photos', 'vendor-product-photos', true);
```

### Step 3: Set RLS Policies

The migration includes RLS policies in the SQL script. If you need to add them manually:

1. Go to **Supabase Dashboard** → Storage → Policies
2. For each bucket, add policies:
   - **Insert:** Allow authenticated users to upload
   - **Select:** Allow public read (to display images)

If you ran the full migration SQL, these are already created.

---

## How It Works

### Application Flow

```
1. Vendor fills out application form
   ↓
2. For each photo field:
   - Click to select image (JPEG/PNG/WEBP, max 10MB)
   - Image uploads directly to Supabase Storage
   - URL stored in component state
   ↓
3. Click "Submit Application"
   - Form data + photo URLs sent to /api/applications
   - Application record created with photo URLs
   ↓
4. Admin approves application
   - Trigger copies photos (+ name, description, socials) to vendors table
   ↓
5. Vendor can edit photos anytime in /vendor/profile
   - Photos already populated with existing URLs
   - Can replace or clear each photo
   - Changes save immediately to vendors table
```

### File Uploads

**Storage paths (automatic):**
- `vendor-logos/{timestamp}-{uuid}.{ext}`
- `vendor-owner-photos/{timestamp}-{uuid}.{ext}`
- `vendor-product-photos/{timestamp}-{uuid}.{ext}`

**Public URLs (returned after upload):**
```
https://[project-id].supabase.co/storage/v1/object/public/vendor-logos/...
```

---

## Testing Checklist

- [ ] Database migration ran successfully (check schema in Supabase)
- [ ] Three storage buckets created and public
- [ ] Go to `/apply` — see three photo fields in the form
- [ ] Upload a test image to each field
  - [ ] Logo: Accepts file, shows preview
  - [ ] Owner photo: Accepts file, shows preview
  - [ ] Product photo: Accepts file, shows preview
- [ ] Validation works:
  - [ ] Rejects files >10MB
  - [ ] Rejects non-image files (TXT, PDF, etc.)
- [ ] Form submits successfully with photos
- [ ] Admin approves the test application
- [ ] Vendor logs in → `/vendor/profile`
  - [ ] Photos are populated from the application
  - [ ] Can upload new versions or remove photos
  - [ ] Changes save and persist

---

## Displaying Photos

### On Public Vendor List
Currently not implemented. To add:
1. Update `components/vendor/VendorCard.tsx` or vendor list component
2. Add `<Image src={vendor.logo_url} />` etc.

### On Vendor Map Detail Panel
Currently shows in `VendorPanel.tsx` (already has `logo_url` display).

To add owner/product photos:
```tsx
{vendor.owner_photo_url && <Image src={vendor.owner_photo_url} alt="Owner" />}
{vendor.featured_photo_url && <Image src={vendor.featured_photo_url} alt="Featured" />}
```

### On Admin Vendor Details
Add to `VendorsAdminTable.tsx` or detail view.

---

## File Size & Type Validation

**Allowed types:**
- `image/jpeg` (JPG)
- `image/png` (PNG)
- `image/webp` (WEBP)

**Max size:** 10 MB per file

**Why these limits?**
- Prevents slow uploads
- Keeps storage costs reasonable
- JPG/PNG/WEBP are web-optimized

---

## Troubleshooting

### Upload fails: "File must be 10MB or smaller"
- Check file size: `ls -lh filename.jpg`
- Compress image before uploading

### Upload fails: "Only image files allowed"
- Ensure file is actually an image (not renamed TXT as JPG)
- Supported formats: JPEG, PNG, WEBP

### Image URL shows but is broken (404)
- Verify bucket is set to **public** (not private)
- Check RLS policies allow public read access
- Verify the URL is correct

### Photos don't show in vendor profile
- Ensure photos were uploaded during application
- Check database: `SELECT logo_url, owner_photo_url FROM vendors WHERE id='...'`
- If NULL, photos weren't saved or trigger didn't copy them

### "Policy not found" error when uploading
- RLS policies need to be created
- Either run the migration SQL or create manually in Supabase dashboard
- Ensure policies are set to INSERT (authenticated) and SELECT (public)

---

## Database Schema

### vendor_applications table
```sql
logo_url TEXT              -- URL or NULL
owner_photo_url TEXT       -- URL or NULL
featured_photo_url TEXT    -- URL or NULL
```

### vendors table
```sql
logo_url TEXT              -- URL or NULL (already exists)
owner_photo_url TEXT       -- URL or NULL (new)
featured_photo_url TEXT    -- URL or NULL (new)
```

---

## Security Notes

1. **No server upload:** Images upload directly from browser to Supabase Storage
   - Reduces server load
   - No need to store images in API
   - Faster for users

2. **RLS Policies:** 
   - Only authenticated users can upload
   - All images are public (as intended for event promotion)
   - Admins can delete inappropriate images via Supabase dashboard

3. **File validation:**
   - Client-side: JPEG/PNG/WEBP, 10MB max
   - Server-side: Should also validate (add if needed)

---

## Future Enhancements

1. **Image optimization:**
   - Auto-resize logo to 500×500px
   - Compress JPG before serving
   - Generate thumbnails

2. **Image display:**
   - Show photos on public vendor directory
   - Add to vendor map detail panel
   - Gallery of all vendor photos

3. **Admin controls:**
   - Approve/moderate vendor photos
   - Delete inappropriate images
   - Bulk upload for multiple vendors

4. **Advanced features:**
   - Crop tool before upload
   - Drag-to-reorder photos
   - Alternative text (alt text) for accessibility

---

## Questions?

If images aren't uploading or displaying, check:
1. Storage buckets exist and are public
2. RLS policies allow uploads and reads
3. Browser console for JavaScript errors
4. Supabase logs for server-side issues

Good luck! 🚀🌿
