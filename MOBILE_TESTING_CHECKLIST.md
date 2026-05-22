# Mobile Responsive Testing Checklist

**Focus:** Functionality & usability (styling refinements come later)

**Test on these viewports:**
- iPhone 12 (390×844) — most common
- iPad (768×1024) — tablet
- Desktop viewport resized to 375px width

**How to test:**
1. Open Chrome DevTools (F12)
2. Click device toggle (top-left)
3. Select device from dropdown or enter custom width

---

## Public Pages

### Home (/)
- [ ] Navigation bar displays correctly
- [ ] Mobile menu (☰) opens/closes
- [ ] Mobile menu includes "Home" option
- [ ] All nav links clickable
- [ ] Hero/content readable
- [ ] Call-to-action buttons clickable
- [ ] Footer visible and functional

### Vendor Map (/map)
- [ ] Map loads and displays
- [ ] Vendor pins visible
- [ ] Category filter accessible and works
- [ ] Clicking pins shows vendor detail panel
- [ ] Detail panel is readable on mobile
- [ ] Map is scrollable and zoomable
- [ ] Close (X) button on detail panel works

### Vendor Directory (/vendors)
- [ ] Vendor list displays properly
- [ ] Vendor cards are readable
- [ ] All vendor info visible (name, email, phone, links)
- [ ] Can scroll through list

### Vendor Application (/apply)
- [ ] "Back to home" link visible and works
- [ ] Form fields stack vertically
- [ ] Labels readable
- [ ] Input fields are large enough to tap
- [ ] Photo upload fields display correctly
- [ ] Submit button is clickable
- [ ] Success message shows after submission

### Sign In (/login)
- [ ] "Back to home" link visible and works
- [ ] Form centered and readable
- [ ] Email input large enough
- [ ] "Send magic link" button clickable
- [ ] Error messages display clearly
- [ ] Help text (rate limit notice) is readable

---

## Authenticated Pages

### Vendor Portal (/vendor/dashboard, /vendor/profile, /vendor/requests)
- [ ] Header displays with "← Home" link
- [ ] Navigation links accessible
- [ ] Dashboard content readable
- [ ] Form fields on profile page are usable
- [ ] Photo upload fields work on mobile
- [ ] "Sign out" button visible and works
- [ ] Main content area doesn't overflow

### Admin Portal (/admin/dashboard, /admin/applications, /admin/vendors, /admin/gallery)
- [ ] Header displays with "← Home" link
- [ ] Admin navigation links accessible
- [ ] Dashboard stats cards display
- [ ] Tables/grids are scrollable horizontally if needed
- [ ] Buttons (approve, reject, etc.) are tapable
- [ ] Vendor map editor loads and displays
- [ ] Map is interactive (drag vendors, zoom)
- [ ] Sidebar for vendor details accessible
- [ ] "Sign out" button visible

---

## Critical Functionality Tests

### Touch Targets
- [ ] All buttons are at least 44×44px (check with DevTools ruler)
- [ ] Links are easily tappable
- [ ] Form inputs have good tap padding

### Input Forms
- [ ] Text fields are large enough to type in
- [ ] Dropdowns/selects open and are usable
- [ ] Checkboxes/radios are tappable
- [ ] File upload inputs accessible
- [ ] Form submission works

### Navigation
- [ ] Mobile menu opens with "☰" button
- [ ] Mobile menu closes when clicking a link
- [ ] "← Home" links work from all portals
- [ ] Back navigation doesn't break on reload
- [ ] Can navigate between all pages

### Map (Critical)
- [ ] Map container has height on mobile
- [ ] Vendor pins are visible
- [ ] Pins are tappable
- [ ] Detail panel slides up without blocking map
- [ ] Can close detail panel
- [ ] Zoom/pan works with touch

---

## Issues to Document

**Found an issue?** Note it here with:
- [ ] Page name
- [ ] Viewport size (iPhone/iPad/375px)
- [ ] What doesn't work
- [ ] Expected behavior
- [ ] Workaround (if any)

Example:
```
## Issue: Vendor map cuts off on mobile
- Page: /map
- Viewport: iPhone 12 (390×844)
- Problem: Map container shows only partial map
- Expected: Full map visible, scrollable
- Workaround: Landscape orientation works
```

---

## Notes

- **Ignore styling issues** (font sizes, padding, colors) — note them separately
- **Focus on:** Can users interact? Do buttons work? Is content accessible?
- **Test interactions:** Clicks/taps, form submission, navigation
- **Test edge cases:** Empty states, long text, many items
- **Test on actual device if possible** (emulation is good but device testing is better)

---

## Summary Template

After testing, fill this in:

**Tested on:** [List devices/viewports]
**Issues found:** [Count]
**Critical blockers:** [Yes/No - list if yes]
**Ready for users:** [Yes/No]

**Critical issues (must fix):**
- [ ] Issue 1
- [ ] Issue 2

**Non-critical (nice to fix):**
- [ ] Issue 3
- [ ] Issue 4
