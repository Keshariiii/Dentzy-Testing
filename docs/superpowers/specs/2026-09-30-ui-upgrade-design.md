# Dentzy UI Upgradation — Design Specification

## Summary

Upgrade the Dentzy frontend across Auth pages, Dentist Portal, Admin Portal, and Staff Portal using existing 21st.dev primitives (`SkiperStatCard`, `VengeanceButton`, `TwentyFirstSegmentedTabs`, `TwentyFirstBadge`, `TwentyFirstNavCard`, `TwentyFirstBottomNav`), standardize icons on `lucide-react`, and apply Impeccable craft-floor rules to eliminate AI-detectable design slop.

## Delivery Strategy

- **Phase 1:** Auth Pages (Login, Register, Forgot Password) + Dentist Portal (Desktop & Mobile)
- **Phase 2:** Admin Portal + Staff Portal

## Design Principles

1. **Ponytail:** No new dependencies. Use what's already in `package.json` (framer-motion, lucide-react, tailwind, radix-slot). Shortest diff wins.
2. **Impeccable Craft Floor:** No gradient text, no decorative glass-blur, no same-size card grids as page structure, no kicker/eyebrow labels, no emoji icons, no hardcoded colors outside tokens.
3. **21st.dev Components:** Maximize reuse of existing `src/components/ui/` primitives before building new ones.

## Icon System Standardization

**Current:** 35+ hand-rolled SVG functions in `DashboardIcons.jsx` + scattered inline SVGs across 15+ files.

**Target:** Replace with `lucide-react` imports. `lucide-react` is already installed (`^0.475.0` in package.json) but unused except for a comment in Footer.jsx.

**Migration rule:** Every inline `<svg>` icon in a component gets replaced with the equivalent `lucide-react` import. Custom DashboardIcons.jsx becomes a thin re-export wrapper mapping old names to lucide icons for backward compat.

## Component Upgrades

### Auth Pages (Login, Register, Forgot Password)

1. **Role Selector (Login):** Replace 3 custom role cards with `TwentyFirstSegmentedTabs` using lucide icons (`Stethoscope`, `ShieldCheck`, `ClipboardList`).
2. **Submit Buttons:** Replace `.auth-btn` with `VengeanceButton` (sage glow, spring press).
3. **Form Inputs:** Add focus ring using `--dz-shadow-focus`, consistent 44px touch targets.
4. **Password Toggle:** Use lucide `Eye`/`EyeOff` icons.
5. **Auth Card:** Unify border-radius to `--dz-radius-lg` (14px).
6. **OTP Input (Register/Forgot):** Clean up styling, add smooth focus highlight.

### Dentist Portal

1. **Stat Cards:** Replace `.ud-stat-card` divs with `SkiperStatCard` (animated counter, trend indicator).
2. **Quick Actions Hub:** Replace 5 same-size cards with `TwentyFirstNavCard` list (asymmetric visual weight).
3. **Status Badges:** Replace `.ud-badge` spans with `TwentyFirstBadge` (pulsing dot for active).
4. **Tab Navigation:** Use `TwentyFirstSegmentedTabs` for Orders/Payments filtering.
5. **Ticker Banner:** Replace scrolling marquee with dismissible announcement pill.
6. **Mobile Bottom Nav:** Already using `TwentyFirstBottomNav` — keep.

### Admin Portal (Phase 2)

1. **Desktop Navigation:** Align with `TwentyFirstSegmentedTabs` for subview switching.
2. **Dentist Verification:** Use `TwentyFirstBadge` for status, `VengeanceButton` for approve action.
3. **Payment Modals:** Wrap with `VengeanceCard` styling.

### Staff Portal (Phase 2)

1. **Order Stage Buttons:** Compact stage advance pills.
2. **Inventory Stepper:** Clean numerical controls with low-stock `TwentyFirstBadge`.
3. **Already uses** `TwentyFirstBottomNav` — keep.

## Token Compliance

All CSS changes must use `--dz-*` tokens from `tokens.css`. No hardcoded hex colors in component CSS. Card radius: `--dz-radius-lg` (14px). Shadows: `--dz-shadow-sm` at rest, `--dz-shadow-lg` on hover.

## Files Affected (Phase 1)

### Create
- None (all upgrades are modifications to existing files)

### Modify
- `src/components/common/DashboardIcons.jsx` — Rewrite to re-export lucide-react icons
- `src/components/Login.jsx` — Role selector → segmented tabs, VengeanceButton, lucide icons
- `src/components/Login.css` — Remove role-card styles, add segmented tab overrides
- `src/components/Register.jsx` — VengeanceButton, lucide icons, input polish
- `src/components/Register.css` — Auth card radius, input focus, button styles
- `src/components/ForgotPassword.jsx` — VengeanceButton, lucide icons
- `src/views/mobile/MobileLogin.jsx` — Segmented tabs for role, lucide icons
- `src/views/mobile/MobileLogin.css` — Mobile auth polish
- `src/views/mobile/MobileRegister.jsx` — VengeanceButton, lucide icons
- `src/views/mobile/MobileRegister.css` — Mobile register polish
- `src/views/mobile/MobileForgotPassword.jsx` — VengeanceButton, lucide icons
- `src/views/mobile/MobileForgotPassword.css` — Mobile forgot password polish
- `src/components/DentistDashboard.jsx` — SkiperStatCard, TwentyFirstNavCard, TwentyFirstBadge, lucide icons
- `src/components/DentistDashboard.css` — Remove old stat/action card styles, token alignment
- `src/views/mobile/MobileDashboard.jsx` — Same upgrades for mobile view
- `src/views/mobile/MobileDashboard.css` — Mobile dashboard polish
