# Mobile Testing Checklist

This document provides a comprehensive checklist for testing mobile responsiveness and usability of the EventForge Inventory application.

## 📱 Touch Target Size Verification

All interactive elements should meet the minimum 44×44px touch target size recommended by Apple and Google.

### Critical Touch Targets

- [ ] All buttons in forms (min 44px height)
- [ ] Navigation menu items (mobile bottom nav: 56px)
- [ ] Icon-only buttons (Edit, Delete, Settings)
- [ ] Dropdown/Select triggers
- [ ] Switch toggles in forms
- [ ] Tab controls
- [ ] Modal close buttons

### Verification Method

1. Open Chrome DevTools
2. Toggle device toolbar (Cmd+Shift+M)
3. Inspect element dimensions
4. Verify computed width/height ≥ 44px

## 📝 Form Usability on Mobile Keyboards

### Text Input Fields

- [ ] Inputs expand properly when keyboard appears
- [ ] Form doesn't scroll behind keyboard
- [ ] Submit button visible with keyboard open
- [ ] Autocomplete/autofill works correctly
- [ ] Next/Previous field navigation works

### Number Input Fields

- [ ] `inputMode="numeric"` triggers numeric keypad
- [ ] Decimal inputs show decimal keypad
- [ ] No autocomplete on date fields
- [ ] Spinners work on mobile

### Date Pickers

- [ ] Native date picker opens on iOS Safari
- [ ] Date format displays correctly
- [ ] `autoComplete="off"` prevents browser suggestions

### Select Dropdowns

- [ ] Native select opens properly
- [ ] Options are readable
- [ ] Multi-select works on mobile
- [ ] Search in select works (if applicable)

## 📦 Modal/Dialog Scrolling Behavior

### Dialog Components

- [ ] Dialogs are scrollable when content exceeds viewport
- [ ] Header remains fixed while content scrolls
- [ ] Footer actions always visible
- [ ] No double scrollbars
- [ ] Pinch-to-zoom disabled in modals
- [ ] Close button always accessible

### Sheet Components (Mobile Menu)

- [ ] Sheet slides in from correct side
- [ ] Backdrop click closes sheet
- [ ] Content scrolls independently
- [ ] No body scroll when sheet is open
- [ ] ESC key closes sheet

## 🧭 Bottom Navigation

### Layout

- [ ] Bottom nav doesn't overlap page content
- [ ] 80px bottom padding on pages (pb-20)
- [ ] Safe area insets respected on iOS
- [ ] Icons and labels are readable
- [ ] Active state clearly visible

### Behavior

- [ ] Tap targets are large enough (56px min)
- [ ] No hover states interfere with touch
- [ ] Navigation persists across pages
- [ ] Active page indicator works

## 📏 Horizontal Scrolling Prevention

### Page Layouts

- [ ] No horizontal scroll on 320px width
- [ ] Tables collapse to cards on mobile
- [ ] Images scale within container
- [ ] Long text wraps or truncates
- [ ] Cards don't exceed container width

### Common Issues to Check

- [ ] Fixed-width tables → use `overflow-x-auto`
- [ ] Long unbreakable strings → add `break-words`
- [ ] Images without max-width → add `max-w-full`
- [ ] Flexbox items → add `min-w-0` to prevent overflow

## 🍎 iOS Safe Area Insets

### iPhone X+ (Notch/Dynamic Island)

- [ ] Top content not hidden behind notch
- [ ] Bottom nav respects home indicator
- [ ] Full-screen modals respect safe areas
- [ ] Landscape orientation handles notch

### CSS Implementation

```css
/* Already implemented in bottom nav */
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## 🔄 Landscape Orientation Handling

### Rotation Behavior

- [ ] Layout adapts to landscape
- [ ] Forms remain usable in landscape
- [ ] Navigation accessible in landscape
- [ ] No content cut off
- [ ] Modals fit in landscape viewport

### Breakpoints to Test

- Portrait: 375×667 (iPhone SE)
- Landscape: 667×375
- Tablet Portrait: 768×1024 (iPad)
- Tablet Landscape: 1024×768

## 🧪 Device-Specific Checks

### iOS Safari (Critical)

- [ ] Form inputs don't zoom on focus
- [ ] Date pickers use native iOS picker
- [ ] Smooth scrolling works
- [ ] Sticky elements behave correctly
- [ ] No viewport issues

#### iOS-Specific CSS

```html
<!-- Already in layout.tsx -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=5"
/>
```

### Android Chrome

- [ ] Overflow scrolling works smoothly
- [ ] Pull-to-refresh doesn't conflict
- [ ] Chrome address bar auto-hide works
- [ ] Select dropdowns open properly
- [ ] Back button behavior correct

### Tablet (iPad/Android Tablet)

- [ ] Responsive breakpoints trigger correctly
- [ ] Desktop nav shows on tablets
- [ ] Forms use appropriate layout
- [ ] Touch targets still adequate
- [ ] Split-screen mode works (iPadOS)

### Small Screens (320px - iPhone SE)

- [ ] All text readable without zoom
- [ ] Buttons not too small
- [ ] Forms not cramped
- [ ] Navigation works
- [ ] No layout breaks

## ⚡ Performance Checks

### Items List (50+ items)

- [ ] Initial render < 2 seconds
- [ ] Scroll is smooth (60fps)
- [ ] Skeleton shows while loading
- [ ] Images lazy load
- [ ] No jank during interactions

### Dashboard Widgets

- [ ] All widgets load concurrently
- [ ] No cumulative layout shift (CLS)
- [ ] Loading skeletons prevent jumps
- [ ] Data updates smoothly

### Image/Icon Loading

- [ ] Icons render without flash
- [ ] No broken image placeholders
- [ ] SVG icons scale properly
- [ ] Loading states for images

### Transitions and Animations

- [ ] Smooth at 60fps
- [ ] No animation jank on low-end devices
- [ ] Respects `prefers-reduced-motion`
- [ ] Animations enhance, not hinder UX

## 🔍 Testing Tools

### Browser DevTools

- Chrome DevTools Mobile Emulator
- Safari Responsive Design Mode
- Firefox Responsive Design Mode

### Real Device Testing

**Recommended Devices:**

- iPhone SE (small screen, iOS)
- iPhone 14 Pro (notch, iOS latest)
- Samsung Galaxy S21 (Android)
- iPad Air (tablet)

### Testing Checklist by Device

```
iPhone SE (320×568):
  ✓ Items page
  ✓ Dashboard
  ✓ Forms (Item, Batch, Waste)
  ✓ Navigation

iPhone 14 Pro (393×852):
  ✓ Safe area insets
  ✓ Dynamic Island clearance
  ✓ All pages

Android Phone (360×740):
  ✓ Material ripple effects
  ✓ System back button
  ✓ All pages

iPad (768×1024):
  ✓ Responsive breakpoints
  ✓ Desktop nav shows
  ✓ Forms layout

Landscape Mode:
  ✓ All devices tested
```

## ✅ Accessibility Quick Checks

### Keyboard Navigation

- [ ] Tab order is logical
- [ ] Focus visible on all elements
- [ ] Skip links work
- [ ] Modals trap focus
- [ ] ESC closes modals

### Screen Reader

- [ ] All buttons have labels
- [ ] Form fields have labels
- [ ] Error messages announced
- [ ] ARIA labels present
- [ ] Landmark regions defined

### Color Contrast

- [ ] Text passes WCAG AA (4.5:1)
- [ ] Large text passes (3:1)
- [ ] Status badges readable
- [ ] Form errors visible

## 🚀 Performance Budget

### Load Time Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Largest Contentful Paint: < 2.5s

### Bundle Size

- Main bundle: < 200KB gzipped
- Total page weight: < 500KB

## 📝 Sign-Off Checklist

Before marking Chunk 9 complete:

- [ ] All touch targets verified (44×44px minimum)
- [ ] Forms tested on iOS Safari + Android Chrome
- [ ] Modal scrolling works on all devices
- [ ] Bottom nav doesn't overlap content
- [ ] No horizontal scrolling on any page
- [ ] Safe area insets respected on iOS
- [ ] Landscape mode works on all pages
- [ ] Items list tested with 50+ items
- [ ] Dashboard loads without layout shift
- [ ] All animations smooth on mid-range device
- [ ] Accessibility quick wins implemented
- [ ] Real device testing completed

## 🐛 Common Mobile Issues & Fixes

### Issue: Input Zoom on iOS

**Fix:** Ensure font-size ≥ 16px on inputs

```css
input {
  font-size: 16px;
}
```

### Issue: 100vh includes address bar

**Fix:** Use CSS with fallback

```css
min-height: 100vh;
min-height: 100dvh; /* Dynamic viewport height */
```

### Issue: Click delay on iOS

**Fix:** Already handled by `-webkit-tap-highlight-color: transparent`

### Issue: Scrolling feels sluggish

**Fix:** Add `-webkit-overflow-scrolling: touch` (already in Tailwind)

## 📊 Testing Status

**Last Updated:** [To be filled during testing]

**Tested By:** [Tester name]

**Test Results:**

- [ ] iPhone SE - All tests passed
- [ ] iPhone 14 Pro - All tests passed
- [ ] Android Phone - All tests passed
- [ ] iPad - All tests passed

**Known Issues:**

1. [List any issues found during testing]
2. [Include reproduction steps]
3. [Priority level: High/Medium/Low]

---

**Next Steps After Testing:**

1. Fix any P0/P1 issues found
2. Document P2 issues for future iteration
3. Get stakeholder sign-off
4. Deploy to staging
5. Production deployment
