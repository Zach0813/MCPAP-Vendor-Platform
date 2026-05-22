# Map & Vendor Display — Recent Improvements

## Summary of Changes

You reported three main issues with the map functionality. Here's what's been implemented:

---

## 1. ✅ Vendor Panel Display — COMPLETE

**Problem:** Vendor panel was only showing category and description, missing name and contact info.

**Solution:**
- Updated `VendorPanel.tsx` to display:
  - Vendor name (with fallback "Unnamed Vendor" if missing)
  - Email with `mailto:` link
  - Phone with `tel:` link
  - Facebook handle (was missing, now included)
  - Reorganized layout with name/category together at top
  - Better spacing and visual hierarchy

**Files Changed:**
- `components/map/VendorPanel.tsx`

**What to test:**
1. Click a vendor pin on the map
2. Verify the panel shows:
   - ✓ Vendor name
   - ✓ Category badge
   - ✓ Logo (if present)
   - ✓ Description
   - ✓ Phone number (clickable tel: link)
   - ✓ Email (clickable mailto: link)
   - ✓ Website link
   - ✓ Social media links (Instagram, Facebook)

---

## 2. ✅ Event Location Hardcoding — COMPLETE

**Problem:** Map was hardcoded to Birmingham, AL even though you updated the event location in the database to Billings, MT.

**Solution:**
- Created `lib/data/events.ts` with `getCurrentEvent()` function
- Updated `lib/mapbox.ts`:
  - Changed default from Birmingham to Billings, MT coordinates
  - Added `buildMapView(eventMapConfig)` function to merge event config with defaults
- Updated map pages to fetch event config:
  - `app/(public)/map/page.tsx` now loads event config
  - `components/map/MapView.tsx` accepts eventMapConfig prop and uses it

**Map now loads coordinates from:**
1. Event's `map_config.center` (if set via admin panel)
2. Falls back to Billings, MT defaults
3. Respects zoom, bearing, pitch from event config

**Files Changed:**
- `lib/mapbox.ts` (updated DEFAULT_VIEW, added buildMapView)
- `lib/data/events.ts` (new)
- `app/(public)/map/page.tsx` (fetch event config)
- `components/map/MapView.tsx` (use eventMapConfig)

**What to test:**
1. Map should now center on Billings, MT by default
2. If you set an event's map_config in the database, the map will use those coordinates
3. The admin event editor (see below) will let you edit this visually

---

## 3. 🔨 Admin Vendor Positioning UI — IN PROGRESS

**Problem:** No way for admins to adjust vendor positions on the map or set booth size.

**Solution - Implemented:**
- Created interactive map editor at `/admin/vendors`
- Admins can now:
  - View all approved vendors on a draggable Mapbox
  - Click vendor pins to select them
  - Drag pins to set new coordinates
  - Manually enter lat/lng for precision
  - Set booth size (length × width in feet)
  - Save positions to database via PUT `/api/vendors/[id]`

**New Files:**
- `components/admin/VendorMapEditor.tsx` — Interactive client component with Mapbox
- `components/admin/VendorMapEditorWrapper.tsx` — Server wrapper for API calls
- `app/api/vendors/[id]/route.ts` — API endpoint to save vendor positions
- Updated `types/index.ts` to include `booth_size` in `MapPosition`
- Updated `app/admin/vendors/page.tsx` to integrate the map editor

**How to use:**
1. Go to `/admin/vendors`
2. Scroll to "Position Vendors on Map" section
3. Click a vendor pin on the map
4. In the sidebar:
   - Adjust Latitude/Longitude manually, OR
   - Drag the pin on the map
   - Set booth size (default 10x10 feet)
   - Click "Save Position"
5. Position will be saved to the database immediately

**What still needs work:**
- [ ] Drag-and-drop on the map isn't fully polished (marker dragging works but needs visual feedback)
- [ ] Could add a "Reset to defaults" button
- [ ] Could add search/filter for vendors
- [ ] Booth size visualization (drawing a rectangle on the map)

---

## 4. 🔲 Admin Event Editor — TODO

**Problem:** Event location/config is in the database but no UI to edit it.

**Status:** Designed but not implemented yet.

**Will implement:**
- New page `/admin/events` (or section on `/admin/dashboard`)
- Editable fields:
  - Event name, location, dates
  - Map center (drag on map or input lat/lng)
  - Map zoom level
  - Map bearing/pitch (for tilted views)
  - Optional: custom Mapbox style URL
- Live preview of how the map will look
- Save back to `events.map_config`

**This will be Task #7** — can implement if you'd like this week.

---

## Architecture Overview

### Data Flow for Map Display

```
Public Map Page (/map)
├─ Server: getCurrentEvent() → loads events.map_config
├─ Server: getApprovedVendorsForMap() → loads vendor positions
└─ Client: MapView component
   ├─ Uses buildMapView(eventMapConfig) for initial center/zoom
   ├─ Renders vendor pins from map_position { lng, lat }
   ├─ Shows VendorPanel on pin click
   └─ Displays category filter

Admin Vendor Editor (/admin/vendors)
├─ Server: loads all vendors
├─ Server: loads getCurrentEvent()
└─ Client: VendorMapEditor
   ├─ Renders draggable pins
   ├─ On drag end: updates local state
   ├─ On save: calls PUT /api/vendors/[id]
   │  └─ Admin client saves to database
   └─ Shows position/booth-size sidebar
```

### Database Schema (Updated)

```sql
-- vendors.map_position is now JSONB with optional booth_size:
{
  "lng": -103.2317,
  "lat": 45.7833,
  "booth_size": { "length": 10, "width": 10 }
}

-- events.map_config (JSONB):
{
  "center": [-103.2317, 45.7833],
  "zoom": 14,
  "bearing": 0,
  "pitch": 0
}
```

---

## Known Issues & Limitations

1. **Vendor missing name field** — If your existing vendor doesn't show a name:
   - Check database: `SELECT id, name, email FROM vendors WHERE status='approved'`
   - If name is NULL, update it: `UPDATE vendors SET name='...' WHERE id='...'`
   - This usually happens if the vendor was manually inserted without a name

2. **Booth size not visualized on public map** — Currently saved but not displayed as rectangles. Could add this with Mapbox layers.

3. **Marker dragging visual feedback** — Works but could be more polished (add cursor, preview line, etc.)

4. **No undo/revert** — Once saved, there's no "undo" button. Could add history tracking if needed.

---

## Testing Checklist

Before deploying, verify:

- [ ] Hard refresh the map page (Ctrl+Shift+R)
- [ ] Vendor panel shows name, email, phone, website, socials
- [ ] Admin vendor editor loads at `/admin/vendors`
- [ ] Can select a vendor pin and see sidebar
- [ ] Can drag vendor pins and see position update in inputs
- [ ] Latitude/Longitude inputs work and update map
- [ ] Booth size inputs accept 5-50 feet
- [ ] Clicking "Save Position" shows success and saves to DB
- [ ] Map center is Billings, MT (not Birmingham)
- [ ] If you edit an event's map_config in DB, map respects it

---

## Next Steps (Priority Order)

### High Priority (User-facing value)
1. **Test the vendor map editor** — Does it work smoothly? Any UX improvements?
2. **Implement photo uploads** (Task #2) — Vendors need to upload logos, booth photos
3. **Add back navigation** (Task #3) — All portals need escape routes

### Medium Priority
4. **Event editor UI** (Task #7) — Makes location/config changes more discoverable
5. **Booth size visualization** — Show rectangles on public map
6. **Mobile menu drawer** (Task #4) — Replace the `<details>` element

### Low Priority (Polish)
7. **Marker drag UX refinement** — Better cursors, preview lines
8. **Tests** — Vitest for components, E2E for map interactions

---

## Files Modified This Session

**New Files:**
- `lib/data/events.ts`
- `components/admin/VendorMapEditor.tsx`
- `components/admin/VendorMapEditorWrapper.tsx`
- `app/api/vendors/[id]/route.ts`
- `MAP_DEBUG.md` (diagnostic guide)
- `MAP_IMPROVEMENTS.md` (this file)

**Modified Files:**
- `lib/mapbox.ts` (buildMapView function, Billings default)
- `components/map/MapView.tsx` (eventMapConfig prop)
- `components/map/VendorPanel.tsx` (email, phone, facebook display)
- `app/(public)/map/page.tsx` (fetch event config)
- `app/admin/vendors/page.tsx` (map editor integration)
- `types/index.ts` (MapPosition booth_size)
- `app/globals.css` (html/body height fixes)
- `app/layout.tsx` (body flex-col)

**Unchanged but related:**
- `supabase/migrations/0002_sync_approved_vendors.sql` (already has correct trigger)

---

## Questions & Support

If something doesn't work:

1. **Hard refresh** your browser (Ctrl+Shift+R / Cmd+Shift+R)
2. **Check browser console** for errors (F12 → Console tab)
3. **Check database** for vendor data:
   ```sql
   SELECT id, name, email, phone, status, map_position
   FROM vendors
   ORDER BY created_at DESC
   LIMIT 5;
   ```
4. **Verify Mapbox token** is still valid and has correct scopes

Feel free to ask for refinements or additional features! 🌿
