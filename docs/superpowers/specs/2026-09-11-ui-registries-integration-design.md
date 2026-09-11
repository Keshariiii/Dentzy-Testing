# Design Specification: UI Registries Integration (Animaster, Skiper UI, Vengeance UI, 21st.dev)

**Date**: 2026-09-11  
**Status**: Validated Design  
**Target Project**: Dentzy Testing Frontend  

---

## 1. Overview & Objectives

This specification defines the architectural integration of four modern animated UI component ecosystems into Dentzy:
* **Animaster Lib**: Awwwards-style text reveals and kinetic ambient shimmers.
* **Vengeance UI**: Cinematic glow-border interactive buttons and spotlight focus cards.
* **Skiper UI**: Motion-forward spring-physics metric stat cards with touch gesture feedback.
* **21st.dev**: Fluid sliding-pill segmented tabs and animated live status pills.

### Core Constraint: Strict Theme Preservation
Dentzy's existing brand identity and color tokens must remain 100% intact:
* **Primary Brand**: Sage Green (`#708c80`), Deep Sage (`#4a6a5a`), Light Sage (`#a3bfb1`)
* **Neutrals & Dark Surfaces**: Dark Forest Charcoal (`#1e2824`), Forest Dark (`#2a3d35`), Surface (`#ffffff`), Canvas (`#f4f7f5`)
* **Typography**: Inter (`var(--font-inter)` / `var(--font-main)`)
* **Existing CSS**: All existing Vanilla CSS files (`reset.css`, `tokens.css`, `index.css`, `AdminDashboard.css`, `MobileDashboard.css`) must continue rendering flawlessly.

---

## 2. Architecture & Foundation

### 2.1 Dependencies
In `frontend/package.json`:
* **CSS & Utility Engine**:
  * `tailwindcss` (v3.4.x), `postcss`, `autoprefixer`, `tailwindcss-animate`
  * `clsx`, `tailwind-merge`, `class-variance-authority`
* **Motion & Primitives**:
  * `framer-motion` (powers interactive gestures and layoutId transitions)
  * `lucide-react` (icon set)
  * `@radix-ui/react-slot`, `@radix-ui/react-tabs`, `@radix-ui/react-dialog`

### 2.2 Tailwind Configuration (`tailwind.config.js`)
Configured to directly bridge Dentzy's CSS custom properties:
```javascript
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--dz-color-primary, #708c80)',
          dark: 'var(--dz-color-primary-dark, #4a6a5a)',
          light: 'var(--dz-color-primary-light, #a3bfb1)',
          muted: 'var(--dz-color-primary-muted, rgba(112, 140, 128, 0.12))',
        },
        charcoal: 'var(--dz-color-charcoal, #1e2824)',
        dark: 'var(--dz-color-dark, #2a3d35)',
        surface: 'var(--dz-color-bg-surface, #ffffff)',
        page: 'var(--dz-color-bg-page, #f4f7f5)',
        border: 'var(--dz-color-border, #e2e8f0)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### 2.3 Shared Utility (`src/lib/utils.js`)
```javascript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

---

## 3. Component Registry Specification (`src/components/ui/`)

### 3.1 Animaster Lib
* **`animaster-text-shimmer.jsx`**:
  * Renders smooth animated linear-gradient text shimmer transitioning across sage green and forest charcoal tones.
* **`animaster-reveal.jsx`**:
  * Staggered character or word reveal with spring easing.

### 3.2 Vengeance UI
* **`vengeance-button.jsx`**:
  * Magnetic hover physics, kinetic border glow using radial gradient rotation, active press scale down.
* **`vengeance-card.jsx`**:
  * Interactive spotlight cursor-tracking glow card container.

### 3.3 Skiper UI
* **`skiper-stat-card.jsx`**:
  * Motion-forward summary card featuring dynamic counter roll-up, touch feedback, status icon badge, and change trend indicator.

### 3.4 21st.dev
* **`twentyfirst-segmented-tabs.jsx`**:
  * Horizontal sliding pill tabs with Framer Motion `layoutId="activeFilterPill"` for fluid tab switching.
* **`twentyfirst-badge.jsx`**:
  * Micro-pill with subtle pulse indicator for `Pending`, `Approved`, `Rejected`, `In Progress`, `Paid`.

---

## 4. View Integration Targets

### 4.1 Landing Page Hero (`src/components/Hero.jsx`)
* Integrate `AnimasterTextShimmer` and `AnimasterReveal` onto the hero header text over `/hero-bg.mp4`.
* Retain the existing typography, messaging, and video background while adding modern fluid motion.

### 4.2 Landing Page CTA (`src/components/CTA.jsx`)
* Upgrade standard button to `VengeanceButton` with Dentzy sage-green kinetic glow and interactive hover/tap feedback.

### 4.3 Mobile Admin Dashboard (`src/views/mobile/MobileAdminDashboard.jsx`)
* **Stats Overview**: Embed `SkiperStatCard` components for Total Dentists, Pending Approvals, Active Lab Orders, and Pending Collections with live counts.
* **Segmented Controls**: Replace native `<select>` dropdowns with `TwentyFirstSegmentedTabs` for rapid, touch-friendly tab filtering (`All`, `Pending`, `Approved`, `Rejected`).
* **Status Badges**: Enhance user and order list items with `TwentyFirstBadge` providing animated live status indication.

---

## 5. Verification Plan

1. **Static Build Test**:
   * Run `npm run build` in `frontend/` to confirm zero JSX, CSS, or bundle errors with Next.js 15 and React 19.
2. **Theme Consistency Check**:
   * Verify all existing pages maintain their exact colors (`#708c80`, `#1e2824`), typography, and responsiveness.
3. **Interactive Verification**:
   * Verify tab switching in Mobile Admin Dashboard with fluid layoutId animation.
   * Verify hero kinetic reveal animation on the Landing Page.
   * Verify hover/tap glow on Vengeance CTA buttons.
