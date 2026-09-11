# UI Registries Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the foundation and active showcase components from Animaster Lib, Vengeance UI, Skiper UI, and 21st.dev into the Dentzy frontend while strictly preserving the existing Sage Green / Dark Forest Charcoal brand identity.

**Architecture:** Install Tailwind CSS, PostCSS, Autoprefixer, and Framer Motion, mapped directly to Dentzy's existing CSS variable design tokens (`--dz-color-*`). Establish a standard `src/components/ui/` directory with `src/lib/utils.js` (`cn` helper). Build and deploy concrete components from each registry into the Landing Page Hero, CTA section, and Mobile Admin Dashboard.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v3, PostCSS, Framer Motion, Lucide React, Radix UI Primitives, clsx, tailwind-merge.

**Spec:** `docs/superpowers/specs/2026-09-11-ui-registries-integration-design.md`

## Global Constraints

- **Primary Brand Colors**: Sage Green (`#708c80`), Deep Sage (`#4a6a5a`), Light Sage (`#a3bfb1`)
- **Dark/Neutral Colors**: Dark Forest Charcoal (`#1e2824`), Forest Dark (`#2a3d35`), Surface (`#ffffff`), Canvas (`#f4f7f5`)
- **Typography**: Inter (`var(--font-inter)` / `var(--font-main)`)
- **Compatibility**: Retain all existing Vanilla CSS styles without breaking layout or visual regressions.
- **Verification**: App must pass `npm run build` with zero Next.js 15 / React 19 errors, and flow verification via Reticle.

---

### Task 1: Scaffolding, Dependencies & Theme Token Foundation

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/postcss.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/src/lib/utils.js`
- Create: `frontend/src/styles/registry.css`
- Modify: `frontend/src/app/layout.jsx`

**Interfaces:**
- Produces: `cn(...inputs)` in `src/lib/utils.js`
- Produces: Tailwind utility classes resolving `--dz-color-*` tokens

- [ ] **Step 1: Install core registry packages**
Install Tailwind CSS, Framer Motion, Lucide Icons, clsx, and Radix primitives in `frontend/`:
```bash
cd "c:\Dentzy Testing\frontend"
npm install tailwindcss@^3.4.17 postcss@^8.4.49 autoprefixer@^10.4.20 tailwindcss-animate@^1.0.7 framer-motion@^12.4.7 lucide-react@^0.475.0 clsx@^2.1.1 tailwind-merge@^3.0.1 class-variance-authority@^0.7.1 @radix-ui/react-slot@^1.1.2
```

- [ ] **Step 2: Create `postcss.config.js` and `tailwind.config.js`**
Create `frontend/postcss.config.js`:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```
Create `frontend/tailwind.config.js` with Dentzy design tokens.

- [ ] **Step 3: Create `src/lib/utils.js`**
Define standard `cn()` merging function:
```javascript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Create `src/styles/registry.css` and import into `src/app/layout.jsx`**
Add `@tailwind base; @tailwind components; @tailwind utilities;` in `registry.css`, and import it into `layout.jsx`.

- [ ] **Step 5: Verify build & commit**
Run: `npm run build` in `frontend/`
Commit: `git commit -m "feat(ui): setup tailwind, framer-motion and registry utilities"`

---

### Task 2: Animaster Lib Components & Hero Integration

**Files:**
- Create: `frontend/src/components/ui/animaster-text-shimmer.jsx`
- Create: `frontend/src/components/ui/animaster-reveal.jsx`
- Modify: `frontend/src/components/Hero.jsx`

**Interfaces:**
- Consumes: `cn` from `src/lib/utils.js`
- Produces: `<AnimasterTextShimmer>`, `<AnimasterReveal>`

- [ ] **Step 1: Build `animaster-text-shimmer.jsx`**
Animated gradient shimmer component styled with Dentzy sage-green and forest dark hues.

- [ ] **Step 2: Build `animaster-reveal.jsx`**
Staggered kinetic word/letter reveal powered by Framer Motion.

- [ ] **Step 3: Integrate into `src/components/Hero.jsx`**
Update Hero heading to utilize `AnimasterReveal` and `AnimasterTextShimmer` over `/hero-bg.mp4`.

- [ ] **Step 4: Verify build & commit**
Run: `npm run build` in `frontend/`
Commit: `git commit -m "feat(ui): add Animaster shimmer and reveal components to Hero"`

---

### Task 3: Vengeance UI Components & CTA Integration

**Files:**
- Create: `frontend/src/components/ui/vengeance-button.jsx`
- Create: `frontend/src/components/ui/vengeance-card.jsx`
- Modify: `frontend/src/components/CTA.jsx`

**Interfaces:**
- Consumes: `cn` from `src/lib/utils.js`
- Produces: `<VengeanceButton>`, `<VengeanceCard>`

- [ ] **Step 1: Build `vengeance-button.jsx`**
Cinematic button with rotating magnetic glow border, subtle glassmorphism backdrop, and active press scale.

- [ ] **Step 2: Build `vengeance-card.jsx`**
Interactive cursor spotlight card container with subtle sage-green radial glow.

- [ ] **Step 3: Integrate into `src/components/CTA.jsx`**
Upgrade CTA buttons to `VengeanceButton` and container to `VengeanceCard`.

- [ ] **Step 4: Verify build & commit**
Run: `npm run build` in `frontend/`
Commit: `git commit -m "feat(ui): add Vengeance UI button and card to CTA section"`

---

### Task 4: Skiper UI & 21st.dev Components & Mobile Admin Dashboard Integration

**Files:**
- Create: `frontend/src/components/ui/skiper-stat-card.jsx`
- Create: `frontend/src/components/ui/twentyfirst-segmented-tabs.jsx`
- Create: `frontend/src/components/ui/twentyfirst-badge.jsx`
- Modify: `frontend/src/views/mobile/MobileAdminDashboard.jsx`

**Interfaces:**
- Consumes: `cn` from `src/lib/utils.js`
- Produces: `<SkiperStatCard>`, `<TwentyFirstSegmentedTabs>`, `<TwentyFirstBadge>`

- [ ] **Step 1: Build `skiper-stat-card.jsx`**
Spring-physics animated metric card with counter reveal, tap bounce feedback, and icon badge.

- [ ] **Step 2: Build `twentyfirst-segmented-tabs.jsx`**
Fluid segmented horizontal tabs with Framer Motion `layoutId` sliding pill.

- [ ] **Step 3: Build `twentyfirst-badge.jsx`**
Micro-badge with pulsing live indicator matching status variants (`pending`, `approved`, `rejected`, `in-progress`, `paid`).

- [ ] **Step 4: Integrate into `MobileAdminDashboard.jsx`**
- Replace static selects with `TwentyFirstSegmentedTabs` for dentist status filtering (`All`, `Pending`, `Approved`, `Rejected`).
- Add `SkiperStatCard` grid at the top of the dashboard displaying dynamic metrics.
- Enhance user cards and order rows with `TwentyFirstBadge`.

- [ ] **Step 5: Verify build & commit**
Run: `npm run build` in `frontend/`
Commit: `git commit -m "feat(ui): integrate Skiper stat cards and 21st.dev tabs into mobile dashboard"`

---

### Task 5: Comprehensive Verification & Reticle Integration Test

- [ ] **Step 1: Run production build**
Run: `npm run build` inside `frontend/` and confirm clean export.

- [ ] **Step 2: Verify in running app via Reticle**
Start or verify dev server and drive an in-app verification flow confirming:
- Hero renders animated Animaster shimmer text
- CTA button renders with Vengeance kinetic glow
- Mobile Admin Dashboard switches tabs fluidly with 21st.dev segmented pill
- Skiper stat cards render live metrics cleanly
