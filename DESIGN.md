# DENTZY Design System

> Single source of truth for design decisions. Read this before touching any CSS.

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--dz-color-primary` | `#708c80` (Sage Green) | Buttons, links, active states |
| `--dz-color-primary-dark` | `#4a6a5a` (Deep Sage) | Hover states, dark accents |
| `--dz-color-primary-accent` | `#1e5038` (Deep Forest) | Key headings, tags, labels |
| `--dz-color-primary-light` | `#a3bfb1` (Light Sage) | Subtle highlights |
| `--dz-color-primary-muted` | `rgba(112,140,128,0.12)` | Tinted backgrounds, borders |
| `--dz-color-charcoal` | `#1e2824` | Primary text, dark backgrounds |

### Status Colors (Semantic)
- **Success:** `#22c55e` / `#dcfce7` / `#166534`
- **Warning:** `#f59e0b` / `#fef3c7` / `#92400e`
- **Error:** `#ef4444` / `#fee2e2` / `#991b1b`
- **Info:** `#3b82f6` / `#dbeafe` / `#1e40af`

## Typography

- **Font Family:** Inter (system-ui fallback stack)
- **Mono:** JetBrains Mono → Fira Code → Cascadia Code

### Fluid Scale (clamp, 768px → 1536px)
| Token | Range | Usage |
|-------|-------|-------|
| `--dz-fluid-display` | 2.5rem → 4.5rem | Hero headings only |
| `--dz-fluid-h1` | 2rem → 3.5rem | Page-level section headings |
| `--dz-fluid-h2` | 1.5rem → 2.8rem | Section titles (`.section-title`) |
| `--dz-fluid-h3` | 1.15rem → 1.6rem | Card titles, sub-headings |
| `--dz-fluid-body` | 0.9rem → 1.1rem | Body paragraphs |
| `--dz-fluid-sm` | 0.8rem → 0.95rem | Secondary text |

### Visual Hierarchy Rule
- `h2` (section titles) **must** be visibly larger than `h3` (card titles)
- Section titles use `--dz-color-primary-accent` (Deep Forest)
- Card titles use `--dz-color-primary-accent` at `--dz-fluid-h3`

## Spacing (Base-8 System)

All spacing values are multiples of 4px:

| Token | Value | Usage |
|-------|-------|-------|
| `--dz-space-1` | 4px | Micro gaps |
| `--dz-space-2` | 8px | Inline spacing |
| `--dz-space-3` | 12px | Small gaps |
| `--dz-space-4` | 16px | Standard padding |
| `--dz-space-6` | 24px | Section gaps |
| `--dz-space-8` | 32px | Component spacing |
| `--dz-space-12` | 48px | Section padding |
| `--dz-space-16` | 64px | Large section breaks |
| `--dz-space-20` | 80px | Hero-level spacing |

**Rule:** Never use hardcoded pixel values for padding, margin, or gap. Always use `var(--dz-space-N)`.

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--dz-radius-sm` | 6px | Small elements, pills |
| `--dz-radius-md` | 10px | Cards, inputs |
| `--dz-radius-lg` | 14px | Modal, large cards |
| `--dz-radius-xl` | 20px | Hero elements |
| `--dz-radius-full` | 9999px | Circles, pill buttons |

## Elevation (Shadows)

| Token | Usage |
|-------|-------|
| `--dz-shadow-xs` | Subtle depth (inputs) |
| `--dz-shadow-sm` | Cards at rest |
| `--dz-shadow-md` | Buttons hover, elevated cards |
| `--dz-shadow-lg` | Card hover states, modals |
| `--dz-shadow-xl` | Popovers, dropdowns |
| `--dz-shadow-focus` | Focus ring on interactive elements |

## Component Patterns

### Section Layout
```html
<section class="[component] section-padding">
  <div class="container">
    <h2 class="section-title text-center">Title</h2>
    <p class="section-subtitle text-center">Muted description</p>
    <!-- content -->
  </div>
</section>
```

### Alternating Backgrounds
Sections should alternate between:
- `var(--dz-color-bg-surface)` (white) — default
- `var(--dz-color-bg-surface-alt)` (`#f8faf9`) — alternate

### Cards
All cards use:
- `background: var(--dz-color-bg-surface)`
- `border: 1px solid var(--dz-color-primary-muted)`
- `border-radius: var(--dz-radius-lg)`
- `box-shadow: var(--dz-shadow-sm)`
- Hover: `translateY(-8px)` + `var(--dz-shadow-lg)`

### Mobile
- Touch targets: minimum 44×44px
- No `background-attachment: fixed` (broken on iOS Safari)
- Pipeline labels: use `text-overflow: ellipsis` for long text
- Ticker speed: minimum 18s for readability

## Don'ts

1. **Don't** use `rgba(112, 140, 128, ...)` — use `var(--dz-color-primary-muted)` or token-derived values
2. **Don't** use legacy `--color-*` tokens — use `--dz-color-*` directly
3. **Don't** use `'SF Mono', 'Fira Code'` for case IDs — use app font with `letter-spacing`
4. **Don't** hardcode `font-size` — use `var(--dz-fluid-*)` tokens
5. **Don't** duplicate utility functions — import from `utils/format`
6. **Don't** duplicate pipeline stage constants — import from `dashboard/shared/constants`
