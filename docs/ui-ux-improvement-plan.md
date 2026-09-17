# Dentzy Frontend — Full UI/UX Improvement Plan

> Every finding from the design audit mapped to: **what to do**, **which skill/plugin handles it**, **which files change**, and **priority**.

---

## Phase 1: Homepage Restructure — Kill the Scroll Fatigue
**Skill:** `impeccable distill` → `impeccable layout`

### 🔴 REMOVE (Merge or Cut)

| # | What to Remove/Merge | Why | Files |
|---|---------------------|-----|-------|
| 1 | **`ConnectWithUs.jsx`** — Cut entirely | Duplicate CTA. Says the same thing as `CTA.jsx` | `ConnectWithUs.jsx`, `ConnectWithUs.css`, `Home.jsx` |
| 2 | **`AboutDetails.jsx`** — Merge into `AboutDentzy.jsx` | Two "About" sections back-to-back is redundant | `AboutDetails.jsx`, `AboutDetails.css`, `AboutDentzy.jsx` |
| 3 | **`FutureServices.jsx`** — Merge into `PerfectSmile.jsx` | Both are card grids of dental products. Combine into one "Our Products" section | `FutureServices.jsx`, `FutureServices.css`, `PerfectSmile.jsx` |

**Result:** 15 sections → 11 sections (Hero → Intro → Services → Process → CTA → About → PerfectSmile → Partners → ProductsIntro → Contact → Footer)

### 🟡 CHANGE (Visual Rhythm Fixes)

| # | What to Change | Why | Files |
|---|---------------|-----|-------|
| 4 | **Alternate section backgrounds** — Add `--dz-color-bg-surface-alt` (#f8faf9) to every other section | Currently all white-on-white. No visual breaks between sections | `Services.css`, `Process.css`, `AboutDentzy.css`, `ProductsIntro.css` |
| 5 | **CTA section** — Add subtitle + 3 benefit bullets + secondary CTA | Currently just "ARE YOU A DENTIST?" + one button. Unfinished. | `CTA.jsx`, `CTA.css` |
| 6 | **Hero video opacity** — Fix duplicate `.hero-video` CSS rule | Lines 19-29 and 31-39 are duplicate definitions | `Hero.css` |

---

## Phase 2: Trust & Social Proof — Build Credibility
**Skill:** `impeccable shape` → `impeccable bolder`

### 🟢 ADD (New Content)

| # | What to Add | Why | Files |
|---|------------|-----|-------|
| 7 | **Trust metrics bar** below hero — "10+ Years \| 500+ Dentists \| 50K+ Cases \| 1-Year Guarantee" | Zero trust signals above the fold. Dentists need confidence to choose a lab | NEW: `TrustBar.jsx`, `TrustBar.css` |
| 8 | **Testimonial section** after Services — Dentist photo + quote + clinic name | No social proof anywhere. This is the #1 missing element for B2B conversion | NEW: `Testimonials.jsx`, `Testimonials.css` |
| 9 | **Certification badges** in PartnerSection — ISO, FDA, quality marks | Partner logos exist but have zero context | `PartnerSection.jsx`, `PartnerSection.css` |
| 10 | **Dead social links** — Replace `#` with real URLs or remove | YouTube, X, Instagram, LinkedIn, Facebook all link to `#` | `Footer.jsx` |

---

## Phase 3: Design System Extraction — One Button, One Card, One Truth
**Skill:** `impeccable extract` → `impeccable document`  
**Plugin:** `ponytail` (simplify the component count)

### 🟡 CHANGE (Unify Components)

| # | What to Change | Why | Files |
|---|---------------|-----|-------|
| 11 | **Unify button system** — ONE `DzButton` with variants: `primary`, `secondary`, `ghost`, `danger` | Currently 4+ button patterns: `.btn-cta`, `.auth-submit`, `VengeanceButton`, `.btn-sm`, dashboard buttons | NEW: `components/ui/DzButton.jsx`, `components/ui/DzButton.css`. UPDATE: all files using buttons |
| 12 | **Unify card component** — ONE `DzCard` with variants: `default`, `elevated`, `outlined` | `.service-card`, `.smile-card`, `.future-card`, `.product-card`, `.info-card`, `.makes-us-item` all have different radius/shadow/hover | NEW: `components/ui/DzCard.jsx`, `components/ui/DzCard.css` |
| 13 | **Use token typography everywhere** — Replace hardcoded `font-size` with `--dz-fluid-*` tokens | 200+ hardcoded `font-size` values across CSS files. Tokens exist but aren't used | ALL component CSS files |
| 14 | **Use token spacing everywhere** — Replace hardcoded `padding`/`margin`/`gap` with `--dz-space-*` | Tokens exist (Base-8 system) but padding values like `20px`, `15px`, `30px` are hardcoded | ALL component CSS files |
| 15 | **Fix rgba() hardcoded values** — Replace `rgba(112, 140, 128, ...)` with token-derived values | ~80 instances of hardcoded brand color in rgba format survived the hex migration | ALL CSS files |
| 16 | **Create DESIGN.md** — Document the design system decisions | No design documentation exists. New contributors can't know what's intentional vs accidental | NEW: `DESIGN.md` |

---

## Phase 4: Dashboard Onboarding — Fix the Cold Start
**Skill:** `impeccable onboard` → `impeccable harden`

### 🟢 ADD (New Experiences)

| # | What to Add | Why | Files |
|---|------------|-----|-------|
| 17 | **Welcome banner** for first-time users — "Welcome, Dr. [Name]! Here's how to get started" with 3-step checklist | New users see zeros everywhere. No idea what to do first. They call the lab instead | `DentistDashboard.jsx`, `MobileDashboard.jsx` |
| 18 | **Empty state illustrations** — For orders list, payments list, pipeline when no data | Empty areas just show nothing. Should show illustration + action prompt | `DentistDashboard.jsx`, `MobileDashboard.jsx` |
| 19 | **Tooltips on dashboard metrics** — "Active Orders: Orders currently being processed in the lab" | Metrics like "In Progress", "Completed" have no context for first-time users | `DentistDashboard.jsx`, `MobileDashboard.jsx` |
| 20 | **Pipeline time estimates** — "Received 2 days ago → QC estimated in 1 day" | Pipeline shows status but not timing. Dentists want to know WHEN, not just WHERE | `DentistDashboard.jsx`, `MobileDashboard.jsx`, `dashboard/shared/constants.js` |

### 🟡 CHANGE (Dashboard UX)

| # | What to Change | Why | Files |
|---|---------------|-----|-------|
| 21 | **Add search/filter to orders list** | With 50+ orders, no way to find a specific patient's case | `DentistDashboard.jsx`, `MobileDashboard.jsx` |
| 22 | **Add keyboard shortcuts** — `N` for new order, `S` for settings, `?` for help | Power users have no efficiency shortcuts | `DentistDashboard.jsx` |

---

## Phase 5: Typography & Color Elevation — Premium Feel
**Skill:** `impeccable typeset` → `impeccable colorize`

### 🟡 CHANGE (Visual Hierarchy)

| # | What to Change | Why | Files |
|---|---------------|-----|-------|
| 23 | **Section titles** — Use `--dz-fluid-h1` (clamp 2rem → 3.5rem) instead of fixed sizes | All section headings look the same weight/size. No visual rhythm | All component CSS with `.section-title` or `h2` |
| 24 | **Add section subtitles** — Muted color, lighter weight, below each heading | Sections go directly heading → content with no breathing room. Add a one-line description | `Services.jsx`, `Process.jsx`, `AboutDentzy.jsx`, `DentzyMakesUs.jsx`, `PerfectSmile.jsx` |
| 25 | **Card title vs section title contrast** — h3 should be clearly smaller than h2 | Currently `h2` (section) and `h3` (card) are too similar in size. Flat hierarchy | ALL component CSS files |
| 26 | **Add accent color usage** — Use `--dz-color-primary-accent` (#1e5038) for key headings, tags, labels | Right now everything is either sage green (#708c80) or charcoal (#1e2824). No depth in the palette | Component CSS files, tokens.css |

---

## Phase 6: Mobile Optimization & Polish
**Skill:** `impeccable adapt` → `impeccable polish`

### 🟡 CHANGE (Mobile-Specific)

| # | What to Change | Why | Files |
|---|---------------|-----|-------|
| 27 | **Mobile service cards** — Horizontal scroll carousel instead of stacked vertical grid | Mobile users get 4 stacked full-width cards = lots of scrolling. Carousel is more natural | `MobileHome.jsx`, `MobileHome.css` |
| 28 | **Sticky mobile CTA** — Bottom-anchored "Get Started" button while scrolling homepage | Mobile users lose the CTA as they scroll. Should persist in thumb zone | `MobileHome.jsx`, `MobileHome.css` |
| 29 | **Fix parallax on mobile Safari** — Remove `background-attachment: fixed` on mobile | iOS Safari doesn't support this property. Creates a jarring visual bug | `CTA.css`, `Hero.css` |
| 30 | **Touch targets** — Ensure all interactive elements ≥ 44px | Some footer links and social icons are below minimum touch size | `Footer.css`, `MobileBottomNav.css` |

### 🟢 ADD (Polish)

| # | What to Add | Why | Files |
|---|------------|-----|-------|
| 31 | **`<noscript>` fallback** — Show a basic message if JS fails | Currently shows empty `<div class="App">` with no content | `layout.jsx` |
| 32 | **Register progress indicator** — Step 1/3, 2/3, 3/3 dots or bar | 3-step registration (form → CAPTCHA → OTP) but user doesn't know how many steps remain | `Register.jsx`, `Register.css`, `MobileRegister.jsx` |
| 33 | **Form real-time validation** — Inline validation on blur, not just on submit | Currently all validation happens on submit. User fills entire form before seeing errors | `Login.jsx`, `Register.jsx`, `ContactForm.jsx` |
| 34 | **Error message specificity** — "Email must include @" not "Invalid email" | Generic error messages don't tell users exactly what's wrong | `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx` |

---

## Execution Order (Recommended)

| Priority | Phase | Impact | Effort | Skill/Command |
|----------|-------|--------|--------|---------------|
| 🔴 **1st** | Phase 1: Homepage restructure | HIGH — first thing users see | Medium | `impeccable distill` |
| 🔴 **2nd** | Phase 2: Trust & social proof | HIGH — conversion driver | Medium | `impeccable shape` + `impeccable bolder` |
| 🟡 **3rd** | Phase 5: Typography elevation | HIGH — premium feel | Low | `impeccable typeset` |
| 🟡 **4th** | Phase 3: Design system extraction | MEDIUM — long-term payoff | High | `impeccable extract` + `ponytail` |
| 🟡 **5th** | Phase 4: Dashboard onboarding | MEDIUM — new user activation | Medium | `impeccable onboard` |
| 🟢 **6th** | Phase 6: Mobile + polish | LOW — refinement | Medium | `impeccable adapt` + `impeccable polish` |

---

## Summary Stats

| Action | Count |
|--------|-------|
| 🟢 **ADD** (new components/features) | 12 |
| 🟡 **CHANGE** (modify existing) | 17 |
| 🔴 **REMOVE** (cut/merge) | 3 |
| **Total items** | **32** |
| **New files to create** | ~10 |
| **Files to modify** | ~35 |
| **Files to delete** | 4 (CSS + JSX for ConnectWithUs, FutureServices) |

> **Approve this plan to begin execution, or tell me which phases to prioritize / skip.**
