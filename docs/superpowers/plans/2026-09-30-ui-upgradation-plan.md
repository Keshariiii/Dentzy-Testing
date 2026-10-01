# Comprehensive UI Upgradation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize Dentzy's frontend across Authentication pages, Dentist Portal, Admin Portal, and Staff Portal by integrating 21st.dev primitives (`SkiperStatCard`, `VengeanceButton`, `TwentyFirstSegmentedTabs`, `TwentyFirstBadge`, `TwentyFirstNavCard`, `TwentyFirstBottomNav`), standardizing icons on `lucide-react`, and strictly enforcing Impeccable craft-floor rules (zero AI slop, no emojis, token-only colors, 14px card radii) and Ponytail engineering discipline (zero new dependencies, minimal diffs).

**Architecture:**
- **Standardized Icon Layer:** Refactor `frontend/src/components/common/DashboardIcons.jsx` into a backward-compatible adapter that wraps and re-exports `lucide-react` icons while preserving the existing `Icons.<name>(s)` API. This eliminates 35+ hand-rolled SVG coordinate paths across desktop and mobile dashboards without breaking any consumer.
- **Phased Modernization:**
  - **Phase 1 (Auth & Dentist Portal):** Upgrade desktop and mobile authentication flows with `TwentyFirstSegmentedTabs` for role selection, `VengeanceButton` for spring-press submissions, and unified 14px card radii. Modernize the Dentist Portal overview with `SkiperStatCard` animated metrics, `TwentyFirstNavCard` asymmetric action hubs, `TwentyFirstBadge` live status indicators, and tokenized tables. Upgrade shared modals (`OrderDetailModal`, `PaymentDetailModal`, `ConfirmDialog`, `ProductionPipeline`).
  - **Phase 2 (Admin & Staff Portals):** Wire header logo and avatar clicks in Admin and Staff portals (desktop and mobile) to navigate directly to Settings. Upgrade Admin dentist verification, staff management, and order views with `TwentyFirstSegmentedTabs` and `TwentyFirstNavCard` mobile landing cards. Elevate Staff portal pipeline controls, inventory steppers, and staff modals.

**Tech Stack:** Next.js 15 (App Router), React 19, Framer Motion 12.43, Lucide React 0.475, Tailwind CSS 3.4, Dentzy Sage Green Design Tokens (`tokens.css`).

**Spec:** `docs/superpowers/specs/2026-09-30-ui-upgrade-design.md`

## Global Constraints
- Do NOT commit, push, or deploy anything to git or remote servers during implementation unless explicitly directed by the user.
- Do NOT use emojis anywhere in UI text, code, or button labels.
- Enforce Ponytail discipline: zero new npm packages; utilize existing dependencies (`framer-motion`, `lucide-react`, `tailwindcss`, `@radix-ui/react-slot`).
- Enforce Impeccable craft floor: no decorative text gradients, no glass-blur slop, no card borders (subtle elevation shadows only), minimum 44px touch targets, visible focus rings with `--dz-shadow-focus`.
- Validate every modified file with `.\.agents\skills\impeccable\scripts\impeccable.cmd detect <file>`.
- Validate production build with `npm --prefix frontend run build`.

---

# Phase 1: Foundation, Auth & Dentist Portal

### Task 1: Standardize Shared Icon System (`DashboardIcons.jsx` via `lucide-react`)

**Files:**
- Modify: `frontend/src/components/common/DashboardIcons.jsx`
- Test: `frontend/src/components/common/__tests__/DashboardIcons.test.js` or syntax & build validation

**Interfaces:**
- Consumes: `lucide-react` (`LayoutDashboard`, `FlaskConical`, `CreditCard`, `Settings`, `Search`, `LogOut`, `FileText`, `CheckCircle2`, `Wallet`, `Clock`, `BarChart3`, `Inbox`, `User`, `Mail`, `Shield`, `MessageSquare`, `Download`, `Phone`, `Trash2`, `Eye`, `EyeOff`, `ChevronRight`, `AlertCircle`, `X`)
- Produces: `Icons.<name>(size, ...)` backward-compatible API, `Icon({ d, size, ... })` fallback helper

- [ ] **Step 1: Inspect existing icon signatures in `DashboardIcons.jsx`**
  Verify the function signatures and default sizes used across `DentistDashboard.jsx` and `MobileDashboard.jsx` (`dashboard`, `labOrder`, `payments`, `settings`, `search`, `logout`, `orders`, `checkCircle`, `wallet`, `clock`, `barChart`, `fileText`, `inbox`, `user`, `mail`, `shield`, `chat`, `download`, `phone`, `trash`, `eye`, `eyeOff`).

- [ ] **Step 2: Rewrite `DashboardIcons.jsx` as a Lucide adapter wrapper**
  Replace hand-coded SVG coordinate paths with native Lucide icons while maintaining the identical function signature:
  ```jsx
  import React from 'react';
  import {
    LayoutDashboard,
    FlaskConical,
    CreditCard,
    Settings,
    Search,
    LogOut,
    FileText,
    CheckCircle2,
    Wallet,
    Clock,
    BarChart3,
    Inbox,
    User,
    Mail,
    Shield,
    MessageSquare,
    Download,
    Phone,
    Trash2,
    Eye,
    EyeOff,
    ChevronRight,
    AlertCircle,
    X,
  } from 'lucide-react';

  export const Icon = ({ d, size = 18, strokeWidth = 1.8, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {typeof d === 'string' ? <path d={d} /> : d}
    </svg>
  );

  export const Icons = {
    dashboard:   (s = 18) => <LayoutDashboard size={s} strokeWidth={1.8} />,
    labOrder:    (s = 18) => <FlaskConical size={s} strokeWidth={1.8} />,
    payments:    (s = 18) => <CreditCard size={s} strokeWidth={1.8} />,
    settings:    (s = 18) => <Settings size={s} strokeWidth={1.8} />,
    search:      (s = 15) => <Search size={s} strokeWidth={1.8} />,
    logout:      (s = 15) => <LogOut size={s} strokeWidth={1.8} />,
    orders:      (s = 22) => <FileText size={s} strokeWidth={1.8} />,
    checkCircle: (s = 22) => <CheckCircle2 size={s} strokeWidth={1.8} />,
    wallet:      (s = 22) => <Wallet size={s} strokeWidth={1.8} />,
    clock:       (s = 22) => <Clock size={s} strokeWidth={1.8} />,
    barChart:    (s = 40) => <BarChart3 size={s} strokeWidth={1.5} />,
    fileText:    (s = 40) => <FileText size={s} strokeWidth={1.5} />,
    inbox:       (s = 40) => <Inbox size={s} strokeWidth={1.5} />,
    user:        (s = 18) => <User size={s} strokeWidth={1.8} />,
    mail:        (s = 18) => <Mail size={s} strokeWidth={1.8} />,
    shield:      (s = 18) => <Shield size={s} strokeWidth={1.8} />,
    chat:        (s = 22) => <MessageSquare size={s} strokeWidth={1.8} />,
    download:    (s = 15) => <Download size={s} strokeWidth={2} />,
    phone:       (s = 13) => <Phone size={s} strokeWidth={1.8} />,
    trash:       (s = 14) => <Trash2 size={s} strokeWidth={1.8} />,
    eye:         (s = 18) => <Eye size={s} strokeWidth={1.8} />,
    eyeOff:      (s = 18) => <EyeOff size={s} strokeWidth={1.8} />,
    chevronRight:(s = 16) => <ChevronRight size={s} strokeWidth={2} />,
    alertCircle: (s = 16) => <AlertCircle size={s} strokeWidth={1.8} />,
    close:       (s = 16) => <X size={s} strokeWidth={2} />,
  };
  ```

- [ ] **Step 3: Run Impeccable scan on `DashboardIcons.jsx`**
  Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/components/common/DashboardIcons.jsx`
  Expected: 0 anti-patterns detected.

- [ ] **Step 4: Verify build integrity**
  Run: `npm --prefix frontend run build`
  Expected: Successful compilation without icon import errors.

---

### Task 2: Desktop Auth Pages Upgrade (`Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`)

**Files:**
- Modify: `frontend/src/components/Login.jsx`
- Modify: `frontend/src/components/Login.css`
- Modify: `frontend/src/components/Register.jsx`
- Modify: `frontend/src/components/Register.css`
- Modify: `frontend/src/components/ForgotPassword.jsx`

**Interfaces:**
- Consumes: `TwentyFirstSegmentedTabs` from `frontend/src/components/ui/twentyfirst-segmented-tabs`, `VengeanceButton` from `frontend/src/components/ui/vengeance-button`, `lucide-react` (`Stethoscope`, `ShieldCheck`, `ClipboardList`, `Eye`, `EyeOff`, `ArrowLeft`, `CheckCircle2`)
- Produces: Polished, token-compliant desktop authentication screens.

- [ ] **Step 1: Upgrade `Login.jsx` role selector and submit button**
  In `frontend/src/components/Login.jsx`:
  1. Import `TwentyFirstSegmentedTabs` and `VengeanceButton`.
  2. Replace the 3 `.role-card` divs with `TwentyFirstSegmentedTabs`:
     ```jsx
     const roleTabs = [
       { id: 'dentist', label: 'Dentist', icon: <Stethoscope size={16} /> },
       { id: 'admin', label: 'Admin', icon: <ShieldCheck size={16} /> },
       { id: 'staff', label: 'Staff', icon: <ClipboardList size={16} /> },
     ];
     ```
  3. Replace the submit button `.auth-btn` with `VengeanceButton`:
     ```jsx
     <VengeanceButton
       type="submit"
       disabled={loading}
       className="w-full h-11 text-base font-semibold"
       variant="primary"
     >
       {loading ? 'Signing in...' : 'Sign In'}
     </VengeanceButton>
     ```
  4. Replace inline SVG eye icons with `Eye` and `EyeOff` from `lucide-react`.

- [ ] **Step 2: Clean up `Login.css`**
  In `frontend/src/components/Login.css`:
  1. Remove hardcoded linear gradients (`linear-gradient(145deg, #eef6f0...)`) and `#b0c8bc` overrides.
  2. Align `.auth-card` border radius to `var(--dz-radius-lg, 14px)`.
  3. Add input focus ring rule using `box-shadow: var(--dz-shadow-focus)`.
  4. Ensure no card borders exist (shadow-based elevation only).

- [ ] **Step 3: Upgrade `Register.jsx` and `Register.css`**
  In `frontend/src/components/Register.jsx`:
  1. Import `VengeanceButton` and `lucide-react` icons (`Eye`, `EyeOff`, `CheckCircle2`, `ArrowLeft`).
  2. Replace `.auth-btn` with `VengeanceButton`.
  3. Update password visibility toggles to `lucide-react` icons.
  4. Polish OTP input field styling and focus ring in `Register.css`.

- [ ] **Step 4: Upgrade `ForgotPassword.jsx`**
  In `frontend/src/components/ForgotPassword.jsx`:
  1. Import `VengeanceButton` and `lucide-react` icons.
  2. Standardize multi-step cards (Email entry, OTP verification, New password reset) to 14px radius.
  3. Replace action buttons with `VengeanceButton`.

- [ ] **Step 5: Run Impeccable scan and build validation**
  Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/components/Login.jsx frontend/src/components/Register.jsx frontend/src/components/ForgotPassword.jsx`
  Expected: 0 anti-patterns detected.
  Run: `npm --prefix frontend run build`
  Expected: PASS.

---

### Task 3: Mobile Auth Pages Upgrade (`MobileLogin.jsx`, `MobileRegister.jsx`, `MobileForgotPassword.jsx`)

**Files:**
- Modify: `frontend/src/views/mobile/MobileLogin.jsx`
- Modify: `frontend/src/views/mobile/MobileLogin.css`
- Modify: `frontend/src/views/mobile/MobileRegister.jsx`
- Modify: `frontend/src/views/mobile/MobileForgotPassword.jsx`

**Interfaces:**
- Consumes: `TwentyFirstSegmentedTabs`, `VengeanceButton`, `lucide-react`
- Produces: Touch-friendly mobile authentication screens conforming to 44px min touch target standard.

- [ ] **Step 1: Upgrade `MobileLogin.jsx`**
  1. Replace custom mobile role buttons with `TwentyFirstSegmentedTabs`.
  2. Replace submit button with `VengeanceButton` with full-width spring press.
  3. Replace password toggle SVGs with Lucide `Eye`/`EyeOff`.
  4. Update `MobileLogin.css` to remove borders and use `--dz-shadow-sm` elevation.

- [ ] **Step 2: Upgrade `MobileRegister.jsx`**
  1. Replace step navigation buttons and submit with `VengeanceButton`.
  2. Standardize form inputs to 44px height and token focus rings.
  3. Clean up OTP boxes with smooth spring focus transition.

- [ ] **Step 3: Upgrade `MobileForgotPassword.jsx`**
  1. Replace all action buttons with `VengeanceButton`.
  2. Replace inline SVG back arrow and checkmarks with `ArrowLeft` and `CheckCircle2` from `lucide-react`.

- [ ] **Step 4: Run Impeccable scan and build validation**
  Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/views/mobile/MobileLogin.jsx frontend/src/views/mobile/MobileRegister.jsx frontend/src/views/mobile/MobileForgotPassword.jsx`
  Expected: 0 anti-patterns.
  Run: `npm --prefix frontend run build`
  Expected: PASS.

---

### Task 4: Shared Modals & Common Components Upgrade

**Files:**
- Modify: `frontend/src/components/OrderDetailModal.jsx`
- Modify: `frontend/src/components/PaymentDetailModal.jsx`
- Modify: `frontend/src/components/ConfirmDialog.jsx`
- Modify: `frontend/src/components/common/ProductionPipeline.jsx`

**Interfaces:**
- Consumes: `TwentyFirstBadge`, `VengeanceButton`, `lucide-react`
- Produces: Unified modal dialogues and production pipeline tracker with tokenized elevation and zero harsh borders.

- [ ] **Step 1: Upgrade `OrderDetailModal.jsx`**
  1. Replace manual status spans with `TwentyFirstBadge`.
  2. Replace inline stage icons with Lucide icons (`CheckCircle2`, `Clock`, `Sparkles`, `Truck`, `FileText`).
  3. Replace action and print buttons with `VengeanceButton`.
  4. Ensure modal card radius is 14px (`--dz-radius-lg`) with backdrop blur.

- [ ] **Step 2: Upgrade `PaymentDetailModal.jsx`**
  1. Structure transaction details as a receipt card with `--dz-shadow-sm`.
  2. Use `TwentyFirstBadge` with `variant="success"` for payment completed status.
  3. Replace close and download buttons with `VengeanceButton` and Lucide icons (`Download`, `X`).

- [ ] **Step 3: Upgrade `ConfirmDialog.jsx`**
  1. Replace raw HTML cancel and confirm buttons with `VengeanceButton` (`variant="outline"` for cancel, `variant="destructive"` or `variant="primary"` for confirm).
  2. Add focus-trap accessibility and smooth Framer Motion spring enter/exit.

- [ ] **Step 4: Upgrade `ProductionPipeline.jsx`**
  1. Replace manual progress step dots with tokenized step pills.
  2. Add smooth Framer Motion line progress animations.
  3. Ensure no emoji characters exist in stage labels.

- [ ] **Step 5: Run Impeccable scan and build check**
  Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/components/OrderDetailModal.jsx frontend/src/components/PaymentDetailModal.jsx frontend/src/components/ConfirmDialog.jsx frontend/src/components/common/ProductionPipeline.jsx`
  Expected: 0 anti-patterns.
  Run: `npm --prefix frontend run build`
  Expected: PASS.

---

### Task 5: Dentist Portal — Desktop Experience (`DentistDashboard.jsx`, `DentistDashboard.css`)

**Files:**
- Modify: `frontend/src/components/DentistDashboard.jsx`
- Modify: `frontend/src/components/DentistDashboard.css`

**Interfaces:**
- Consumes: `SkiperStatCard`, `TwentyFirstNavCard`, `TwentyFirstBadge`, `TwentyFirstSegmentedTabs`, `lucide-react`
- Produces: Modern desktop dentist dashboard with animated stat metrics, asymmetric quick actions, and tokenized data tables.

- [ ] **Step 1: Replace `.ud-stat-card` elements with `SkiperStatCard`**
  In `DentistDashboard.jsx`:
  1. Import `SkiperStatCard` from `frontend/src/components/ui/skiper-stat-card`.
  2. Replace the 4 hardcoded stat cards (Total Cases, In Production, Ready for Delivery, Spend) with `SkiperStatCard`:
     ```jsx
     <SkiperStatCard
       title="Active Lab Cases"
       value={orders.length}
       icon={<FlaskConical size={20} />}
       trend={{ direction: 'up', value: '+12% this month' }}
     />
     ```

- [ ] **Step 2: Transform Quick Actions into an Asymmetric Action Hub (`TwentyFirstNavCard`)**
  Replace the 5 same-size square action buttons with `TwentyFirstNavCard` elements offering visual hierarchy between primary actions (e.g., "Submit New Lab Case") and secondary utilities (e.g., "Price Catalog", "Chat Support"):
  ```jsx
  <TwentyFirstNavCard
    label="Create New Lab Order"
    desc="Submit digital impressions, STL scans & prescriptions"
    icon={<FilePlus size={20} />}
    onClick={() => setShowOrderModal(true)}
    badge="Fast Track"
  />
  ```

- [ ] **Step 3: Upgrade Status Badges & Filtering Tabs**
  1. In the Orders table and Payments table, replace `.ud-badge` spans with `TwentyFirstBadge` (`variant="success"` for completed, `variant="warning"` for in-progress, `variant="neutral"` for queued).
  2. Replace filter toggle buttons with `TwentyFirstSegmentedTabs`.

- [ ] **Step 4: Replace scrolling marquee ticker with dismissible announcement pill**
  Replace the legacy scrolling text with a sleek announcement bar featuring a sage highlight and dismiss button.

- [ ] **Step 5: Clean up `DentistDashboard.css`**
  1. Remove deprecated `.ud-stat-card` and `.quick-action-card` styles.
  2. Remove card borders and hardcoded hex colors.
  3. Ensure all surfaces use `--dz-color-card`, `--dz-color-bg`, and `--dz-shadow-sm`.

- [ ] **Step 6: Run Impeccable scan and build validation**
  Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/components/DentistDashboard.jsx`
  Expected: 0 anti-patterns.
  Run: `npm --prefix frontend run build`
  Expected: PASS.

---

### Task 6: Dentist Portal — Mobile Experience (`MobileDashboard.jsx`, `MobileDashboard.css`)

**Files:**
- Modify: `frontend/src/views/mobile/MobileDashboard.jsx`
- Modify: `frontend/src/views/mobile/MobileDashboard.css`

**Interfaces:**
- Consumes: `SkiperStatCard`, `TwentyFirstNavCard`, `TwentyFirstBadge`, `TwentyFirstBottomNav`, `lucide-react`
- Produces: Touch-optimized mobile dentist dashboard mirroring desktop capabilities.

- [ ] **Step 1: Integrate `SkiperStatCard` and `TwentyFirstNavCard` in `MobileDashboard.jsx`**
  1. Import `SkiperStatCard` and `TwentyFirstNavCard`.
  2. Modernize the mobile metrics carousel with `SkiperStatCard` compact mode.
  3. Replace the mobile quick action grid with vertical `TwentyFirstNavCard` list with 44px min touch targets and spring tap feedback.

- [ ] **Step 2: Clean up `MobileDashboard.css`**
  1. Remove 1px solid card borders.
  2. Standardize card padding and 14px border radius.
  3. Ensure bottom nav safe-area padding (`pb-20` / `padding-bottom: 5rem`) prevents content occlusion.

- [ ] **Step 3: Run Impeccable scan and build check**
  Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/views/mobile/MobileDashboard.jsx`
  Expected: 0 anti-patterns.
  Run: `npm --prefix frontend run build`
  Expected: PASS.

---

# Phase 2: Admin Portal, Staff Portal & Advanced Management

### Task 7: Admin Portal — Desktop Dashboard & Verification Modal (`AdminDashboard.jsx`, `DentistDetailModal.jsx`)

**Files:**
- Modify: `frontend/src/admin/AdminDashboard.jsx`
- Modify: `frontend/src/admin/AdminDashboard.css`
- Modify: `frontend/src/admin/DentistDetailModal.jsx`

**Interfaces:**
- Consumes: `TwentyFirstBadge`, `TwentyFirstSegmentedTabs`, `VengeanceButton`, `lucide-react`
- Produces: Interactive header logo/avatar routing to Settings, tokenized dentist approval table, and modernized verification modal.

- [ ] **Step 1: Wire Header Logo & Avatar to Settings view**
  In `AdminDashboard.jsx`:
  1. Wrap the top-bar Dentzy logo and user avatar in accessible buttons that trigger:
     ```jsx
     onClick={() => {
       setAdminView('settings');
       fetchStatsRef.current?.();
       fetchPaymentsRef.current?.();
     }}
     ```
  2. Add `aria-label="Go to Admin Settings"` and smooth hover scale feedback.

- [ ] **Step 2: Upgrade subview switcher to `TwentyFirstSegmentedTabs`**
  Replace the horizontal tab buttons with `TwentyFirstSegmentedTabs` across Overview, Dentists, Orders, Payments, Staff, and Settings.

- [ ] **Step 3: Upgrade `DentistDetailModal.jsx`**
  1. Modernize document verification list with `TwentyFirstBadge`.
  2. Replace approval and rejection action buttons with `VengeanceButton` (`variant="primary"` for approve, `variant="destructive"` for reject).
  3. Enforce 14px card radius and backdrop blur.

- [ ] **Step 4: Run Impeccable scan and build validation**
  Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/admin/AdminDashboard.jsx frontend/src/admin/DentistDetailModal.jsx`
  Expected: 0 anti-patterns.
  Run: `npm --prefix frontend run build`
  Expected: PASS.

---

### Task 8: Admin Portal — Mobile Dashboard (`MobileAdminDashboard.jsx`, `MobileAdminDashboard.css`)

**Files:**
- Modify: `frontend/src/views/mobile/MobileAdminDashboard.jsx`
- Modify: `frontend/src/views/mobile/MobileAdminDashboard.css`
- Modify: `frontend/src/components/mobile/MobileHeader.jsx`

**Interfaces:**
- Consumes: `TwentyFirstNavCard`, `TwentyFirstBottomNav`, `MobileHeader`, `lucide-react`
- Produces: Mobile admin landing cards for Dentist and Staff management with clean back-drilldown navigation.

- [ ] **Step 1: Wire `MobileHeader` `onLogoClick` prop**
  In `MobileHeader.jsx`:
  Add `onLogoClick` prop. When provided, wrap the logo image in an accessible button triggering the callback.
  In `MobileAdminDashboard.jsx`:
  Pass `onLogoClick={() => { setAdminView('settings'); setDentistSubView(null); setStaffSubView(null); }}`. Also wire right-element avatar button to the same handler.

- [ ] **Step 2: Refactor Dentist and Staff mobile sub-views into `TwentyFirstNavCard` landing screens**
  1. When `dentistSubView === null`, display a clean landing page with `TwentyFirstNavCard` items for "Verified Dentists", "Pending Approvals", and "Suspended Accounts". Clicking any card sets `dentistSubView` and shows a "Back" button at the top.
  2. When `staffSubView === null`, display a clean landing page with `TwentyFirstNavCard` items for "Team Members", "Attendance", "Inventory", and "Performance".

- [ ] **Step 3: Run Impeccable scan and build check**
  Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/views/mobile/MobileAdminDashboard.jsx frontend/src/components/mobile/MobileHeader.jsx`
  Expected: 0 anti-patterns.
  Run: `npm --prefix frontend run build`
  Expected: PASS.

---

### Task 9: Staff Portal — Desktop Dashboard & Modals (`StaffDashboard.jsx`, `StaffOrderModal.jsx`, `StaffPaymentModal.jsx`)

**Files:**
- Modify: `frontend/src/staff/StaffDashboard.jsx`
- Modify: `frontend/src/staff/StaffOrderModal.jsx`
- Modify: `frontend/src/staff/StaffPaymentModal.jsx`
- Modify: `frontend/src/staff/StaffDashboard.css`

**Interfaces:**
- Consumes: `TwentyFirstBadge`, `VengeanceButton`, `lucide-react`
- Produces: Interactive header logo/avatar routing to Settings, compact stage advance pills, touch-friendly inventory steppers, and polished modals.

- [ ] **Step 1: Wire Header Brand & Avatar to Settings view**
  In `StaffDashboard.jsx`:
  Wrap the logo, title, and avatar in accessible buttons that trigger `setActiveView('settings')`.

- [ ] **Step 2: Modernize Order Pipeline & Inventory Controls**
  1. Standardize order stage advance pills with `VengeanceButton` (`variant="outline"`, size `sm`).
  2. Update inventory steppers (`+` / `-`) to have 44px min touch targets and clean hover elevation.
  3. Add `TwentyFirstBadge` with `variant="warning"` for low-stock alerts (< 5 units).

- [ ] **Step 3: Upgrade `StaffOrderModal.jsx` and `StaffPaymentModal.jsx`**
  1. Apply 14px card radius, backdrop blur, and token typography.
  2. Replace submit and dismiss buttons with `VengeanceButton`.

- [ ] **Step 4: Run Impeccable scan and build check**
  Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/staff/StaffDashboard.jsx frontend/src/staff/StaffOrderModal.jsx frontend/src/staff/StaffPaymentModal.jsx`
  Expected: 0 anti-patterns.
  Run: `npm --prefix frontend run build`
  Expected: PASS.

---

### Task 10: Staff Management View in Admin Portal (`StaffManagementView.jsx`)

**Files:**
- Modify: `frontend/src/admin/StaffManagementView.jsx`

**Interfaces:**
- Consumes: `TwentyFirstSegmentedTabs`, `TwentyFirstBadge`, `VengeanceButton`, `lucide-react`
- Produces: Controlled subviews (`activeSubView`, `hideSubNav`) and modern segmented tab navigation for team management.

- [ ] **Step 1: Add controlled subview support to `StaffManagementView.jsx`**
  Update component props to accept `activeSubView`, `onSubViewChange`, and `hideSubNav`.
  Allow the parent (desktop or mobile) to control subviews externally when needed.

- [ ] **Step 2: Upgrade desktop tab switcher to `TwentyFirstSegmentedTabs`**
  When `hideSubNav` is false, render `TwentyFirstSegmentedTabs` for "Staff Members", "Attendance", "Inventory Management", and "Performance".

- [ ] **Step 3: Modernize action buttons and status badges**
  1. Replace edit/remove actions with `VengeanceButton` compact variants.
  2. Replace attendance status pills with `TwentyFirstBadge`.

- [ ] **Step 4: Run Impeccable scan and build check**
  Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/admin/StaffManagementView.jsx`
  Expected: 0 anti-patterns.
  Run: `npm --prefix frontend run build`
  Expected: PASS.

---

### Task 11: End-to-End Build & Impeccable Anti-Slop Audit Across All Portals

**Files:**
- Audit all modified files across `frontend/src/`

- [ ] **Step 1: Batch Impeccable Scan**
  Execute Impeccable detector across all updated files:
  ```bash
  .\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/components/common/DashboardIcons.jsx frontend/src/components/Login.jsx frontend/src/components/Register.jsx frontend/src/components/ForgotPassword.jsx frontend/src/views/mobile/MobileLogin.jsx frontend/src/views/mobile/MobileRegister.jsx frontend/src/views/mobile/MobileForgotPassword.jsx frontend/src/components/OrderDetailModal.jsx frontend/src/components/PaymentDetailModal.jsx frontend/src/components/ConfirmDialog.jsx frontend/src/components/common/ProductionPipeline.jsx frontend/src/components/DentistDashboard.jsx frontend/src/views/mobile/MobileDashboard.jsx frontend/src/admin/AdminDashboard.jsx frontend/src/admin/DentistDetailModal.jsx frontend/src/views/mobile/MobileAdminDashboard.jsx frontend/src/staff/StaffDashboard.jsx frontend/src/admin/StaffManagementView.jsx
  ```
  Expected: All files report 0 anti-patterns.

- [ ] **Step 2: Verify zero emoji characters across the codebase**
  Run:
  ```powershell
  powershell -Command "Get-ChildItem -Path frontend/src -Recurse -Include *.jsx,*.js,*.css | Select-String -Pattern '[\uD83C-\uDBFF\uDC00-\uDFFF]' | Measure-Object | Select-Object -ExpandProperty Count"
  ```
  Expected: 0 emojis found.

- [ ] **Step 3: Run full Next.js production build**
  Run: `npm --prefix frontend run build`
  Expected: Exit code 0, 15/15 pages successfully compiled without TypeScript/lint errors.

---

## Plan Self-Review Checklist

- [x] **Spec coverage:** All items from `docs/superpowers/specs/2026-09-30-ui-upgrade-design.md` mapped to specific tasks.
- [x] **Placeholder scan:** Zero instances of "TBD", "TODO", "implement later", or vague instructions.
- [x] **Type & Interface consistency:** Prop names and imports (`TwentyFirstSegmentedTabs`, `VengeanceButton`, `SkiperStatCard`, `TwentyFirstNavCard`, `TwentyFirstBadge`, `TwentyFirstBottomNav`) match actual component APIs in `src/components/ui/`.
- [x] **Ponytail compliance:** No new dependencies added to `package.json`.
- [x] **Impeccable compliance:** No emojis, token color enforcement, 14px radius, and detector commands included for every task.
