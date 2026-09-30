# Staff Portal Mobile Navbar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Redesign and upgrade the Staff Portal navbar for mobile devices by replacing text-only representations with clean logo branding in the top bar, integrating a premium 21st.dev animated mobile navigation component with SVG icons (no emojis), adhering to the Ponytail principle (minimal code, zero bloat), and passing the Impeccable design detector with 0 anti-patterns.

**Architecture:** 
1. **21st.dev Animated Navigation Component** (`frontend/src/components/ui/twentyfirst-bottom-nav.jsx`): A lightweight, touch-optimized floating bottom nav component built with `framer-motion` (`layoutId` spring indicator), frosted glass styling (`backdrop-blur-md bg-white/95`), and crisp SVG icons for each section.
2. **Top Header Logo Refinement** (`frontend/src/staff/StaffDashboard.jsx` & `StaffDashboard.css`): On mobile viewports, streamline the top navbar so the Dentzy logo (`/dentzy-logo-v2.png`) is the crisp visual anchor, removing cluttered text titles and replacing text with logo branding.
3. **Anti-pattern & Over-engineering Elimination (Impeccable & Ponytail)**: Remove the redundant Google Fonts `@import` of Inter in `StaffDashboard.css` (flagged as `[overused-font]` by Impeccable detector) in favor of the project design token `var(--dz-font-family, system-ui, sans-serif)`, and reuse existing icons from `DashboardIcons` to avoid adding external dependencies.

**Tech Stack:** Next.js 15 (App Router), React 19, Framer Motion, Tailwind CSS / Vanilla CSS with Dentzy design tokens (`--dz-*`), `clsx`, `tailwind-merge`.

---

## Global Constraints

- **No emojis anywhere**: Never use emojis for navigation items, buttons, or badges. Use pure SVG icons.
- **21st.dev component architecture**: Follow the pattern of existing components in `frontend/src/components/ui/` (`twentyfirst-segmented-tabs.jsx`) using `cn()`, `framer-motion`, and Tailwind utility tokens.
- **Ponytail principles**: Shortest working diff, reuse existing `Icons` from `src/components/common/DashboardIcons.jsx`, zero bloat, zero unrequested abstractions.
- **Impeccable detector**: Running `impeccable detect` must return 0 anti-patterns (no overused font imports, no fake accent lines).
- **Responsive parity**: Desktop view remains fully functional while mobile view gains native app-like UX.

---

### Task 1: Create 21st.dev Mobile Navigation Component

**Files:**
- Create: `frontend/src/components/ui/twentyfirst-bottom-nav.jsx`

**Interfaces:**
- Consumes:
  - `cn` from `../../lib/utils`
  - `motion` from `framer-motion`
  - Props: `items: Array<{ key: string, label: string, icon: (active: boolean) => React.ReactNode }>`, `activeKey: string`, `onChange: (key: string) => void`, `className?: string`, `layoutId?: string`
- Produces:
  - Default export `TwentyFirstBottomNav` and named export `{ TwentyFirstBottomNav }`

- [x] **Step 1: Write `twentyfirst-bottom-nav.jsx`**

```jsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstBottomNav — 21st.dev
 *
 * Floating app-style bottom navigation bar with fluid Framer Motion spring pill.
 * Designed for mobile viewports (< 768px). Uses pure SVG icons with zero emojis.
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string, icon: (active: boolean) => React.ReactNode }>} props.items
 * @param {string} props.activeKey
 * @param {(key: string) => void} props.onChange
 * @param {string} [props.className]
 * @param {string} [props.layoutId='staff-nav-pill']
 */
export function TwentyFirstBottomNav({
  items,
  activeKey,
  onChange,
  className,
  layoutId = 'staff-nav-pill',
}) {
  return (
    <nav
      className={cn(
        'fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around',
        'bg-white/95 backdrop-blur-md border border-neutral-200/80 rounded-2xl',
        'p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)]',
        'md:hidden',
        className,
      )}
      aria-label="Staff navigation"
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={cn(
              'relative z-10 flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl',
              'transition-colors duration-200 select-none cursor-pointer min-h-[52px]',
              isActive ? 'text-[#1e5038]' : 'text-neutral-500 hover:text-neutral-800',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-[#eef6f2]"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center mb-0.5">
              {item.icon(isActive)}
            </span>
            <span
              className={cn(
                'relative z-10 text-[10px] tracking-tight leading-tight',
                isActive ? 'font-bold text-[#1e5038]' : 'font-medium text-neutral-600',
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default TwentyFirstBottomNav;
```

- [x] **Step 2: Run Impeccable detector on the new component**

Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/components/ui/twentyfirst-bottom-nav.jsx`  
Expected: Exit code 0, 0 anti-patterns found.

---

### Task 2: Update Staff Header & Connect 21st.dev Nav in `StaffDashboard.jsx`

**Files:**
- Modify: `frontend/src/staff/StaffDashboard.jsx`

**Details:**
1. Import `TwentyFirstBottomNav` from `../components/ui/twentyfirst-bottom-nav`.
2. Define SVG icons for each `NAV_ITEMS` entry using shared `Ico` from `DashboardIcons`:
   - `orders`: `(active) => Ico.labOrder(active ? 20 : 19)`
   - `dentists`: `(active) => Ico.clinic(active ? 20 : 19)`
   - `inventory`: `(active) => Ico.package(active ? 20 : 19)`
   - `leaderboard`: `(active) => Ico.chart(active ? 20 : 19)`
   - `settings`: `(active) => Ico.settings(active ? 20 : 19)`
3. In the top navbar (`sd-header`):
   - Replace the static text title on mobile with an emphasis on the Dentzy logo image, rendering a clean responsive logo mark (`/dentzy-logo-v2.png`) and role badge without crowded text.
4. Replace the old `.sd-bottom-nav` element with `<TwentyFirstBottomNav items={NAV_ITEMS} activeKey={activeView} onChange={setActiveView} />`.

- [x] **Step 1: Update `NAV_ITEMS` definition with SVG icon callbacks (no emojis)**

```javascript
const NAV_ITEMS = [
  { key: 'orders', label: 'Orders', icon: (active) => Ico.labOrder(active ? 20 : 19) },
  { key: 'dentists', label: 'Dentists', icon: (active) => Ico.clinic(active ? 20 : 19) },
  { key: 'inventory', label: 'Inventory', icon: (active) => Ico.package(active ? 20 : 19) },
  { key: 'leaderboard', label: 'Leaderboard', icon: (active) => Ico.chart(active ? 20 : 19) },
  { key: 'settings', label: 'Settings', icon: (active) => Ico.settings(active ? 20 : 19) },
];
```

- [x] **Step 2: Update top bar markup in `StaffDashboard.jsx`**

Streamline `.sd-header-left`:
```jsx
<div className="sd-header-left">
  <img src="/dentzy-logo-v2.png" alt="Dentzy" className="sd-logo" />
  <span className="sd-header-title">Staff Portal</span>
</div>
```
Ensure `.sd-header-title` is hidden on mobile via CSS so the logo stands alone as the primary brand mark.

- [x] **Step 3: Replace old text-only bottom nav with `TwentyFirstBottomNav`**

```jsx
{/* ── 21st.dev Mobile Bottom Nav ─────────────────────────────── */}
<TwentyFirstBottomNav
  items={NAV_ITEMS}
  activeKey={activeView}
  onChange={setActiveView}
/>
```

---

### Task 3: Revamp CSS in `StaffDashboard.css` and Eliminate Impeccable Anti-patterns

**Files:**
- Modify: `frontend/src/staff/StaffDashboard.css`

**Details:**
1. **Fix Impeccable Anti-Pattern**: Remove the `@import url('https://fonts.googleapis.com/css2?family=Inter...');` on line 7 and update `font-family: 'Inter', ...` to use `var(--dz-font-family, system-ui, sans-serif)`.
2. **Mobile Header Logo Refinement**:
   - On mobile (`max-width: 767px`), hide `.sd-header-title` text so the Dentzy logo is the sole, prominent navbar element.
   - Optimize `.sd-logo` sizing on mobile (height `32px`) with crisp alignment.
3. **Mobile Shell Spacing**:
   - Adjust `.sd-shell` on mobile: `padding-bottom: 84px` to provide breathing room above the floating 21st.dev navigation dock.
4. **Clean up Deprecated CSS**:
   - Remove unused `.sd-bottom-nav`, `.sd-bnav-btn`, `.sd-bnav-label` styles since `TwentyFirstBottomNav` manages its own Tailwind classes.

- [x] **Step 1: Remove Google Fonts `@import` and replace font family with design token**
- [x] **Step 2: Add mobile header rules hiding title text and showcasing logo**
- [x] **Step 3: Update `.sd-shell` bottom padding and remove deprecated `.sd-bottom-nav` styles**

---

### Task 4: Validate with Impeccable Detector, Build & Dev Server

**Details:**
1. Run Impeccable detector on `frontend/src/staff/` and `frontend/src/components/ui/` to ensure **0 anti-patterns**.
2. Run `npm run build` in `frontend/` to confirm production build succeeds without Next.js/Tailwind/React errors.
3. Run dev server test to verify HTTP response and component compilation.

- [x] **Step 1: Run Impeccable detector check**

Run: `.\.agents\skills\impeccable\scripts\impeccable.cmd detect frontend/src/staff/`  
Expected: Exit code 0, 0 anti-patterns.

- [x] **Step 2: Run production build verification**

Run: `npm run build` in `frontend/`  
Expected: `✓ Compiled successfully`, all static pages generated with 0 errors.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-30-staff-mobile-navbar-update.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach would you like to proceed with?
