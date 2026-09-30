# Admin Staff Portal Redesign & Header Logo Redirect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Transform the Admin Portal's Staff section into a clean landing-card experience mirroring the Dentist section using a 21st.dev action card component, and wire the header logo & avatar across both Admin and Staff portals (Mobile and PC) to redirect to Settings.

**Architecture:**
- Create a reusable, tactile 21st.dev `TwentyFirstNavCard` component in `frontend/src/components/ui/twentyfirst-nav-card.jsx` powered by Framer Motion tap and hover physics, adhering to Ponytail (minimal, DRY) and Impeccable (no emojis, token colors, clean elevation).
- In Mobile Admin (`MobileAdminDashboard.jsx`), introduce `staffSubView` state mirroring `dentistSubView`: default to a "Staff Management" landing screen featuring 4 navigation cards (Members, Attendance, Inventory, Metrics), drilling down into `StaffManagementView` with a top "Back" button.
- Refactor `StaffManagementView.jsx` to accept `activeSubView`, `onSubViewChange`, and `hideSubNav` props, and elevate its desktop tab switcher using `TwentyFirstSegmentedTabs`.
- Wire `MobileHeader.jsx` (`onLogoClick`), `MobileAdminDashboard.jsx` (avatar + logo), `AdminDashboard.jsx` (PC logo + avatar), and `StaffDashboard.jsx` (PC/Mobile logo + avatar) to smoothly switch to Settings view on click.

**Tech Stack:** Next.js 15 (App Router), React 19, Framer Motion, Tailwind CSS / Vanilla CSS Variables (`--dz-color-*`), Impeccable design system tokens.

**Spec:** User request `2026-09-30` + screenshots (`media_1790753953332.png` and `media_1790753963067.png`).

## Global Constraints
- Do NOT commit, push, or deploy anything.
- Do NOT use emojis anywhere in code, UI, or text labels.
- Follow Ponytail minimalism: reuse existing `DashboardIcons` (no extra icon packages), reuse existing color tokens (`--dz-color-*`), keep changes concise and robust.
- Follow Impeccable design standards: zero card borders (subtle elevation shadows only), minimum 44px touch targets, full keyboard accessibility with focus rings.
- Validate all modified files with `.\.agents\skills\impeccable\scripts\impeccable.cmd detect <file>`.
- Validate production build with `npm --prefix frontend run build`.

---

### Task 1: Create 21st.dev Navigation Card Component (`TwentyFirstNavCard`)

**Files:**
- Create: `frontend/src/components/ui/twentyfirst-nav-card.jsx`
- Test: `frontend/src/components/ui/__tests__/twentyfirst-nav-card.test.jsx` (or syntax validation via build)

**Interfaces:**
- Produces: `TwentyFirstNavCard({ label, desc, icon, onClick, badge, className, ariaLabel })`
- Consumes: `framer-motion` (`motion`), `cn` from `frontend/src/lib/utils.js`

- [x] **Step 1: Write component specification & code for `TwentyFirstNavCard`**

Create `frontend/src/components/ui/twentyfirst-nav-card.jsx`:
```jsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstNavCard — 21st.dev
 *
 * Interactive action/navigation card with tactile spring tap feedback,
 * rounded icon container, title, description, and right chevron.
 *
 * @param {object} props
 * @param {string} props.label - Card title
 * @param {string} props.desc - Subtitle / description
 * @param {React.ReactNode} props.icon - Icon element
 * @param {() => void} props.onClick - Click handler
 * @param {string|number} [props.badge] - Optional badge count/text
 * @param {string} [props.className] - Additional classes
 * @param {string} [props.ariaLabel] - Accessibility label
 */
export function TwentyFirstNavCard({
  label,
  desc,
  icon,
  onClick,
  badge,
  className,
  ariaLabel,
  ...props
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'group flex w-full items-center gap-3.5 rounded-[14px] bg-white p-4 sm:p-[18px_16px]',
        'text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
        'border-none cursor-pointer outline-none transition-shadow duration-200',
        'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          'bg-[var(--dz-color-primary-muted,#e8f5ee)] text-[var(--dz-color-primary-dark,#1e5038)]',
          'transition-colors duration-200 group-hover:bg-[var(--dz-color-primary-dark,#1e5038)] group-hover:text-white',
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[0.92rem] font-bold text-[#1a1a1a] leading-tight">
            {label}
          </span>
          {badge !== undefined && badge !== null && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
              {badge}
            </span>
          )}
        </div>
        {desc && (
          <p className="mt-0.5 truncate text-[0.76rem] text-[#708c80] leading-snug">
            {desc}
          </p>
        )}
      </div>

      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#aab"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-auto shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:stroke-[#1e5038]"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </motion.button>
  );
}

export default TwentyFirstNavCard;
```

- [x] **Step 2: Run Impeccable detector on the new component**

Run:
```powershell
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/components/ui/twentyfirst-nav-card.jsx
```
Expected: 0 anti-patterns detected.

---

### Task 2: Adapt `StaffManagementView` for Controlled SubViews & 21st.dev Segmented Tabs

**Files:**
- Modify: `frontend/src/admin/StaffManagementView.jsx:23-40, 310-335`

**Interfaces:**
- Consumes: `TwentyFirstSegmentedTabs` from `../components/ui/twentyfirst-segmented-tabs`
- Produces: Enhanced `StaffManagementView` supporting controlled `activeSubView`, `onSubViewChange`, and `hideSubNav` boolean.

- [x] **Step 1: Update `StaffManagementView.jsx` props and subview state**

In `frontend/src/admin/StaffManagementView.jsx`:
1. Import `TwentyFirstSegmentedTabs`:
```javascript
import { TwentyFirstSegmentedTabs } from '../components/ui/twentyfirst-segmented-tabs';
```
2. Accept `activeSubView`, `onSubViewChange`, and `hideSubNav = false` in props:
```javascript
const StaffManagementView = ({
  authFetch, ADMIN_API, showToast,
  staffList, loadingStaff, staffSearch, setStaffSearch,
  fetchStaff, setStaffList, Ico, setConfirmConfig,
  activeSubView, onSubViewChange, hideSubNav = false,
}) => {
  const [internalSubView, setInternalSubView] = useState('members');
  const subView = activeSubView !== undefined ? activeSubView : internalSubView;
  const setSubView = onSubViewChange || setInternalSubView;
```
3. Update tab bar around line 313:
```javascript
      {/* Sub-Nav — rendered when hideSubNav is false (e.g. PC desktop view) */}
      {!hideSubNav && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <TwentyFirstSegmentedTabs
            tabs={SUB_VIEWS}
            activeKey={subView}
            onTabChange={setSubView}
            layoutId="staff-subview-pill"
          />
        </div>
      )}
```

- [x] **Step 2: Run Impeccable detector on `StaffManagementView.jsx`**

Run:
```powershell
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/admin/StaffManagementView.jsx
```
Expected: 0 anti-patterns detected.

---

### Task 3: Implement Staff Management Landing Page & Unify Cards in `MobileAdminDashboard`

**Files:**
- Modify: `frontend/src/views/mobile/MobileAdminDashboard.jsx:50-70, 608-646, 1158-1178, 1314-1327`

**Interfaces:**
- Consumes: `TwentyFirstNavCard` from `../../components/ui/twentyfirst-nav-card`
- Produces:
  - `staffSubView` state (`null | 'members' | 'attendance' | 'inventory' | 'metrics'`)
  - "Staff Management" landing screen matching "Dentist Management" with 4 tactile cards
  - Back navigation from Staff subviews
  - Unified `TwentyFirstNavCard` usage on both Dentist Management and Staff Management

- [x] **Step 1: Import `TwentyFirstNavCard` and declare Staff landing cards configuration**

In `frontend/src/views/mobile/MobileAdminDashboard.jsx`:
```javascript
import { TwentyFirstNavCard } from '../../components/ui/twentyfirst-nav-card';
```
Define the `STAFF_SECTIONS` configuration:
```javascript
const STAFF_SECTIONS = [
  { key: 'members', label: 'Members', desc: 'Manage staff directory and roles', iconFn: () => Ico.usersS ? Ico.usersS(22) : Ico.user(22) },
  { key: 'attendance', label: 'Attendance', desc: 'Daily check-in and attendance history', iconFn: () => Ico.clockS ? Ico.clockS(22) : Ico.clock(22) },
  { key: 'inventory', label: 'Inventory', desc: 'Lab materials and stock levels', iconFn: () => Ico.package(22) },
  { key: 'metrics', label: 'Metrics', desc: 'Staff performance and analytics', iconFn: () => Ico.chart ? Ico.chart(22) : Ico.dashboard(22) },
];
```

- [x] **Step 2: Add `staffSubView` state and update bottom nav onChange**

In `MobileAdminDashboard.jsx`:
```javascript
const [staffSubView, setStaffSubView] = useState(null); // null | 'members' | 'attendance' | 'inventory' | 'metrics'
```
In `TwentyFirstBottomNav.onChange`:
```javascript
onChange={(key) => {
  setAdminView(key);
  if (key === 'dentists') setDentistSubView(null);
  if (key === 'staff') {
    setStaffSubView(null);
    fetchStaff();
  }
  if (key === 'settings') {
    fetchStats();
    fetchPayments();
  }
}}
```

- [x] **Step 3: Update Dentist Management landing cards to use `TwentyFirstNavCard`**

Refactor the Dentist landing cards in `MobileAdminDashboard.jsx` (around line 610) to use `TwentyFirstNavCard` for DRY consistency:
```jsx
      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: DENTISTS
          ───────────────────────────────────────────────────────────── */}
      {adminView === 'dentists' && !dentistSubView && (
        <div style={{ padding: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dz-color-charcoal)', margin: '0 0 16px' }}>Dentist Management</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { key: 'users', label: 'Dentists', desc: 'Manage registered dentists', iconFn: () => Ico.usersS(22) },
              { key: 'orders', label: 'Lab Orders', desc: 'Track all lab orders', iconFn: () => Ico.labOrder(22) },
              { key: 'payments', label: 'Payments', desc: 'Billing and payment records', iconFn: () => Ico.payments(22) },
            ].map(card => (
              <TwentyFirstNavCard
                key={card.key}
                label={card.label}
                desc={card.desc}
                icon={card.iconFn()}
                onClick={() => {
                  setDentistSubView(card.key);
                  if (card.key === 'orders') fetchAllOrders();
                  if (card.key === 'payments') fetchPaymentsRef.current?.();
                }}
              />
            ))}
          </div>
        </div>
      )}
```

- [x] **Step 4: Implement Staff Management landing screen and drill-down subview**

Replace the existing `{adminView === 'staff' && ...}` block (around line 1159) with:
```jsx
      {/* ─────────────────────────────────────────────────────────────
          VIEW 2: STAFF
          ───────────────────────────────────────────────────────────── */}
      {adminView === 'staff' && !staffSubView && (
        /* Staff Landing Page with 4 sub-section cards */
        <div style={{ padding: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dz-color-charcoal)', margin: '0 0 16px' }}>Staff Management</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {STAFF_SECTIONS.map(card => (
              <TwentyFirstNavCard
                key={card.key}
                label={card.label}
                desc={card.desc}
                icon={card.iconFn()}
                onClick={() => setStaffSubView(card.key)}
              />
            ))}
          </div>
        </div>
      )}

      {adminView === 'staff' && staffSubView && (
        <>
          {/* Back to Staff landing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px 4px' }}>
            <button
              onClick={() => setStaffSubView(null)}
              aria-label="Back to Staff Management"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--dz-color-primary-dark)', display: 'flex', alignItems: 'center' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--dz-color-charcoal)' }}>Back</span>
          </div>

          <div style={{ padding: '16px', paddingBottom: '90px' }}>
            <StaffManagementView
              authFetch={authFetch}
              ADMIN_API={ADMIN_API}
              showToast={showToast}
              staffList={staffList}
              loadingStaff={loadingStaff}
              staffSearch={staffSearch}
              setStaffSearch={setStaffSearch}
              fetchStaff={fetchStaff}
              setStaffList={setStaffList}
              Ico={Ico}
              setConfirmConfig={setConfirmConfig}
              activeSubView={staffSubView}
              onSubViewChange={setStaffSubView}
              hideSubNav={true}
            />
          </div>
        </>
      )}
```

- [x] **Step 5: Run Impeccable detector on `MobileAdminDashboard.jsx`**

Run:
```powershell
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/views/mobile/MobileAdminDashboard.jsx
```
Expected: 0 anti-patterns detected.

---

### Task 4: Wire Header Logo & Avatar Click -> Settings in Admin Portal (Mobile & PC)

**Files:**
- Modify: `frontend/src/components/mobile/MobileHeader.jsx:13-42`
- Modify: `frontend/src/views/mobile/MobileAdminDashboard.jsx:568-577`
- Modify: `frontend/src/admin/AdminDashboard.jsx:520-547`

**Interfaces:**
- Consumes: `onLogoClick` prop in `MobileHeader`
- Produces: Header logo and avatar clicking in Admin Dashboard (both mobile and PC) smoothly transitions view to Settings.

- [x] **Step 1: Add `onLogoClick` support to `MobileHeader.jsx`**

In `frontend/src/components/mobile/MobileHeader.jsx`:
Update signature to accept `onLogoClick = null`:
```javascript
const MobileHeader = ({
  title = null,
  showBack = false,
  transparent = false,
  showLogin = true,
  onAvatarClick = null,
  onLogoClick = null,
  children = null,
  rightElement = null,
}) => {
```
In the `.m-header__left` block:
```jsx
      <div className="m-header__left">
        {showBack ? (
          <button className="m-header__back" onClick={() => router.push(-1)} aria-label="Go back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        ) : onLogoClick ? (
          <button
            type="button"
            className="m-header__logo-btn"
            onClick={onLogoClick}
            aria-label="Settings"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <img src={dentzyLogo} alt="Dentzy" className="m-header__logo" />
          </button>
        ) : (
          <img src={dentzyLogo} alt="Dentzy" className="m-header__logo" />
        )}
      </div>
```

- [x] **Step 2: Connect logo and avatar clicks in `MobileAdminDashboard.jsx`**

Update `MobileHeader` in `frontend/src/views/mobile/MobileAdminDashboard.jsx`:
```jsx
      <MobileHeader
        title={null}
        showLogin={false}
        onLogoClick={() => {
          setAdminView('settings');
          setDentistSubView(null);
          setStaffSubView(null);
          fetchStats();
          fetchPayments();
        }}
        rightElement={
          <button
            type="button"
            className="ma-avatar"
            onClick={() => {
              setAdminView('settings');
              setDentistSubView(null);
              setStaffSubView(null);
              fetchStats();
              fetchPayments();
            }}
            aria-label="Admin Settings"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            {initials}
          </button>
        }
      />
```

- [x] **Step 3: Connect logo and avatar clicks in PC `AdminDashboard.jsx`**

In `frontend/src/admin/AdminDashboard.jsx`:
Update the header logo (around line 520):
```jsx
        {/* Logo */}
        <button
          type="button"
          className="ad-header-logo-btn"
          onClick={() => {
            setAdminView('settings');
            fetchStatsRef.current?.();
            fetchPaymentsRef.current?.();
          }}
          aria-label="Go to Settings"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div className="ad-header-logo">
            <img src={dentzyLogo} alt="Dentzy" className="ad-logo-img" />
          </div>
        </button>
```
Update the admin user & avatar area (around line 537):
```jsx
        {/* Admin info */}
        <button
          type="button"
          className="ad-header-user"
          onClick={() => {
            setAdminView('settings');
            fetchStatsRef.current?.();
            fetchPaymentsRef.current?.();
          }}
          aria-label="Admin Profile Settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <div className="ad-header-user-details">
            <span className="ad-header-admin-name">{adminName}</span>
            <span className="ad-header-admin-role">
              <span className="ad-live-dot" />
              Admin
            </span>
          </div>
          <div className="ad-header-avatar">{initials}</div>
        </button>
```

- [x] **Step 4: Run Impeccable detector on `MobileHeader.jsx`, `MobileAdminDashboard.jsx`, and `AdminDashboard.jsx`**

Run:
```powershell
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/components/mobile/MobileHeader.jsx
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/admin/AdminDashboard.jsx
```
Expected: 0 anti-patterns detected.

---

### Task 5: Wire Header Logo & Avatar Click -> Settings in Staff Portal (Mobile & PC)

**Files:**
- Modify: `frontend/src/staff/StaffDashboard.jsx:355-370`
- Modify: `frontend/src/staff/StaffDashboard.css`

**Interfaces:**
- Produces: Clicking header logo or avatar in Staff Dashboard (Mobile and PC) redirects to Settings view (`activeView = 'settings'`).

- [x] **Step 1: Update header in `StaffDashboard.jsx`**

In `frontend/src/staff/StaffDashboard.jsx`:
Update the header (around lines 356-370):
```jsx
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="sd-header">
        <button
          type="button"
          className="sd-header-left"
          onClick={() => setActiveView('settings')}
          aria-label="Go to Staff Settings"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          <img src="/dentzy-logo-v2.png" alt="Dentzy" className="sd-logo" />
          <span className="sd-header-title">Staff Portal</span>
        </button>
        <div className="sd-header-right">
          <span className="sd-header-name">{staffName}</span>
          <button
            type="button"
            className="sd-avatar-btn"
            onClick={() => setActiveView('settings')}
            aria-label="Staff Profile Settings"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <div className="sd-avatar">{initials}</div>
          </button>
          <button onClick={handleLogout} className="sd-logout-btn">
            {Ico.logout(16)} <span className="sd-logout-text">Logout</span>
          </button>
        </div>
      </header>
```

- [x] **Step 2: Add interactive hover styles in `StaffDashboard.css`**

In `frontend/src/staff/StaffDashboard.css`:
```css
.sd-header-left {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.sd-header-left:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.sd-avatar-btn {
  transition: transform 0.15s ease;
}
.sd-avatar-btn:hover {
  transform: scale(1.05);
}
```

- [x] **Step 3: Run Impeccable detector on `StaffDashboard.jsx`**

Run:
```powershell
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/staff/StaffDashboard.jsx
```
Expected: 0 anti-patterns detected.

---

### Task 6: Full Verification & Build Validation

**Files:**
- Test all touched files across the project.

- [x] **Step 1: Run Impeccable detector across all modified files**

Run:
```powershell
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/components/ui/twentyfirst-nav-card.jsx
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/admin/StaffManagementView.jsx
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/views/mobile/MobileAdminDashboard.jsx
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/components/mobile/MobileHeader.jsx
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/admin/AdminDashboard.jsx
.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/staff/StaffDashboard.jsx
```
Expected: All files pass with 0 anti-patterns.

- [x] **Step 2: Run Next.js production build**

Run:
```powershell
npm --prefix frontend run build
```
Expected: Build succeeds with 0 errors across all 15 routes.

- [x] **Step 3: Verify user constraints are preserved**
- Check that git working tree has no unintended commits.
- Check that no emojis exist in any of the modified files.
- Verify that both mobile and PC versions redirect to settings upon clicking the header logo and avatar.
- Verify that mobile Staff section renders the 4 landing cards and cleanly drills down with a back button.
