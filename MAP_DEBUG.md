# Map Loading — Diagnostic & Fixes

## Issues Found & Fixed

### 1. **Height CSS Cascade** ✅ Fixed
The map container wasn't getting proper height due to incorrect CSS constraints.

**Changes made:**
- `app/globals.css`: Added `@apply h-full` to `html` and `body` elements
- `app/layout.tsx`: Added `flex flex-col` to `<body>` to create proper flex context
- `app/(public)/map/page.tsx`: 
  - Changed outer div from `min-h-[calc(100vh-var(--header-height))]` to `h-full` (uses actual available height instead of calculating against 100vh)
  - Added `overflow-hidden` to the flex-1 container to prevent any overflow issues

**Why this matters:**
The previous CSS used `calc(100vh - 64px)` which doesn't work correctly when the container is nested inside a growing flex child. The new approach uses actual viewport heights:
1. `html` → full viewport height
2. `body` → full viewport height + flex column
3. `main` → flex-1 (grows to fill space between header/footer)
4. `map page div` → h-full (uses actual main height)
5. `map container` → h-full w-full (fills available space)

---

## What to Check Now

### Browser Console Check
Open DevTools (F12) and look for:
1. Any red JavaScript errors
2. Any network errors loading Mapbox GL JS
3. Any token-related errors

**Common errors to watch for:**
```
// If you see this, the token isn't configured:
"Map needs configuration — Add a valid NEXT_PUBLIC_MAPBOX_TOKEN..."

// If you see CORS errors, check the Mapbox token scopes
// (should have: styles:read, fonts:read, datasets:read)

// If the map loads but no pins show, check that vendors exist
// in the database with valid map_position { lng, lat }
```

### Network Tab Check
Verify these resources load:
1. `mapbox-gl.js` (Mapbox library) — should be ~1MB
2. `mapbox-gl.css` (Mapbox styles) — should load
3. Your style URL: `mapbox://styles/mapbox/light-v11` — should respond with style JSON

### Map-Specific Checks
1. **Does the map container have height?**
   - Right-click map area → Inspect
   - Look for the `<div ref={containerRef} className="h-full w-full" />` element
   - In DevTools, it should show a computed height (not 0px)

2. **Are there vendors to display?**
   - The map only shows vendors that have:
     - `status = 'approved'` in the database
     - Valid `map_position` as JSON: `{ lng: number, lat: number }`
   - No approved vendors yet? Map will show but no pins.

3. **Is the Mapbox token valid?**
   - The token in `.env.local` must:
     - Start with `pk.` (public token, not secret)
     - Have correct scopes: `styles:read, fonts:read, datasets:read`
   - Test the token: Visit [Mapbox Tokens Page](https://account.mapbox.com/access-tokens/) and verify it's listed and active

---

## Development Tips

### Quick Test: Check Token Loading
Add this to browser console (DevTools):
```javascript
fetch('http://localhost:3000/api/health')  // Any API route
  .then(r => r.text())
  .catch(e => console.error('Fetch failed:', e))
```

Or inspect the MapView component:
```javascript
// In MapView.tsx, the token is available as MAPBOX_TOKEN
// If it logs empty, the env var didn't load
```

### If Map Still Doesn't Show
1. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clears Next.js cache
   
2. **Rebuild:** Run `npm run build` then `npm run start`
   - Tests production build (env vars might load differently)

3. **Check `.env.local` directly:**
   ```bash
   grep MAPBOX_TOKEN .env.local
   # Should output your token starting with pk.
   ```

4. **Verify Mapbox GL loaded:**
   In browser console:
   ```javascript
   console.log(typeof mapboxgl, mapboxgl.accessToken)
   // Should show: "object" and "pk.eyJ..."
   ```

---

## Next Steps (If Map Works)

Once the map displays correctly:

1. **Add vendor positioning:** Currently the 0002 trigger sets all approved vendors to Birmingham coords (-86.8025, 33.5186). You'll want to implement the admin UI for custom map positions on `/admin/vendors/[id]`.

2. **Test the category filter** at the top of the map.

3. **Click vendor pins** to verify the detail panel slides up (mobile) or appears on the right (desktop).

4. **Test on mobile:** Use DevTools device emulation (375px wide) to ensure it's responsive.

---

## If You Get Stuck

Check these in order:
1. ✅ `.env.local` has `NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...`
2. ✅ Browser console has no red errors
3. ✅ Mapbox GL JS library loaded in Network tab
4. ✅ Map container div has non-zero height (DevTools inspector)
5. ✅ Database has at least one approved vendor with valid map_position

Feel free to share console errors or DevTools screenshots if it's still not working!
