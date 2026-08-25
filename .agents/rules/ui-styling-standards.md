---
description: Permanent strict rules for card design and styling (Zero side/upper color accents).
---

# UI Styling Standards for Dentzy Lab

## 1. Zero Card Stripe Accents
**Strict Rule**: No card component (stat card, user card, action card, order card, info card, notification banner, process card) may have directional colored borders or accent stripes.
- **FORBIDDEN**: `border-top: 3px solid var(--color-primary);`
- **FORBIDDEN**: `border-left: 3px solid #10b981;`
- **FORBIDDEN**: Using `::before` or `::after` pseudo-elements to create vertical or horizontal colored bars on the edges of cards.

## 2. Uniform Minimalist Card Styling
Cards must maintain a strict, uniform minimalist aesthetic:
- **Borders**: Only use uniform neutral thin borders for the entire card (e.g., `border: 1px solid #eef2f0;` or `border: 1px solid rgba(0,0,0,0.08);`).
- **Shadows**: Use subtle, diffuse shadows (e.g., `box-shadow: 0 4px 14px rgba(0,0,0,0.05);`).
- **Border Radius**: Use consistent rounded corners (e.g., `border-radius: 12px;` or `14px;`).

## 3. Status Differentiation
Do not use card borders or background colors to indicate entity status (e.g., Pending, Approved, Rejected).
- **REQUIRED**: Status must be indicated exclusively via inner content:
  - Text badges or pills (e.g., `<span className="ad-status-badge approved">Approved</span>`).
  - Font colors on specific text elements.
  - Iconography.
