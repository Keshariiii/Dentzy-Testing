# Staff Epic Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Staff Portal (Orders, Inventory, Leaderboard) and Admin Manual Attendance, utilizing premium `21st.dev`/Impeccable UI and lazy/efficient Ponytail engineering.

**Architecture:** Cloudflare Workers (Backend) + Next.js Static Export (Frontend). Admin tracks attendance manually (no biometric IoT). Staff portal interacts with scoped `/api/staff/*` routes. UI leverages 21st.dev-inspired minimalistic, high-craft aesthetics (shadows, no borders, slick animations).

**Tech Stack:** React, Next.js, Cloudflare Workers, Hono, D1 Database, Tailwind CSS (if applicable) / Vanilla CSS.

**Spec:** `further_plans.md` (Plan 2: EPIC — STAFF MANAGEMENT SYSTEM, minus Biometrics)

## Global Constraints

- **Ponytail Mode:** Full. YAGNI. Shortest working diff. Re-use existing patterns. No speculative abstractions.
- **Impeccable UI:** Premium craft. Use 21st.dev for polished components. 
- **Strict UI Rules:** NO emojis anywhere. NO side/upper/lower border lines on any cards (use box-shadows only).
- **Attendance:** Manual tracking by Admin only (no biometric webhook).

---

### Task 1: Backend - Staff Module APIs & Database

**Files:**
- Modify: `backend/d1/schema.sql`
- Modify: `backend/src/routes/staff.js`
- Modify: `backend/src/routes/admin.js`
- Create: `backend/d1/migrate_staff_epic.sql`

**Interfaces:**
- Produces: `POST /api/admin/staff/attendance`
- Produces: `GET /api/staff/orders` and `PATCH /api/staff/orders/:id/stage`
- Produces: `GET /api/staff/inventory` and `POST /api/staff/inventory`

- [x] **Step 1: Write the schema migration for Attendance, Inventory & Gamification**
```sql
-- backend/d1/migrate_staff_epic.sql
CREATE TABLE IF NOT EXISTS staff_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Half-day')),
    logged_by_admin TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    unit TEXT NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- For Gamification tracking (who processed the case)
ALTER TABLE lab_orders ADD COLUMN assigned_staff_id TEXT DEFAULT NULL;
```

- [x] **Step 2: Implement Admin Manual Attendance API**
Modified `backend/src/routes/admin.js` — added attendance (mark + history), inventory oversight (CRUD), and metrics/leaderboard endpoints.

- [x] **Step 3: Implement Staff Orders & Inventory APIs**
Modified `backend/src/routes/staff.js` — added orders (list + stage update with auto-assign), inventory CRUD, and personal metrics endpoint.

- [x] **Step 4: Build verification**
`wrangler deploy --dry-run` passed cleanly (818 KiB bundle, no errors).

- [x] **Step 5: Commit**
Committed in `dd12e67`.

---

### Task 2: Frontend - Admin Staff Management UI

**Files:**
- Modify: `frontend/src/admin/AdminDashboard.jsx`
- Modify: `frontend/src/views/mobile/MobileAdminDashboard.jsx`

**Interfaces:**
- Consumes: `POST /api/admin/staff/:id/attendance`
- Consumes: `GET /api/admin/staff/inventory` (New) and `GET /api/admin/staff/metrics` (New)

- [x] **Step 1: Add "Create Staff" UI to Staff List**
Created `StaffManagementView.jsx` shared component with Create Staff modal (Display Name, Username, Password).

- [x] **Step 2: Add "Mark Attendance" Action to Staff List**
Added Mark Attendance modal with date picker and Present/Absent/Half-day status buttons + attendance history view.

- [x] **Step 3: Add Inventory & Metrics Oversight Views**
Added 4-tab sub-navigation: Members, Attendance, Inventory (CRUD with +/- stock buttons), Metrics (leaderboard with Staff of the Month).

- [x] **Step 4: Implement API calls**
All fetch calls wired: create staff, toggle status, delete staff, mark attendance, fetch history, inventory CRUD, metrics/leaderboard.

- [x] **Step 5: Update Mobile Admin View**
Both `AdminDashboard.jsx` and `MobileAdminDashboard.jsx` share the same `StaffManagementView` component (ponytail: one component, not two).

- [x] **Step 6: Test UI rendering**
`npm run build` passed cleanly -- compiled successfully, 13/13 pages generated, 0 errors.

- [x] **Step 7: Commit**
Combined frontend epic commit.

---

### Task 3: Frontend - Staff Portal Shell & Orders (21st.dev UI)

**Files:**
- Create: `frontend/src/staff/StaffDashboard.jsx`
- Create: `frontend/src/staff/StaffDashboard.css`
- Create: `frontend/src/app/staff/dashboard/page.jsx`
- Modify: `frontend/src/app/page.jsx`
- Modify: `frontend/src/components/Login.jsx` and `frontend/src/views/mobile/MobileLogin.jsx`

**Interfaces:**
- Consumes: `GET /api/staff/orders` and `PATCH /api/staff/orders/:id/stage`

- [x] **Step 1: Build the Staff Shell**
Created `StaffDashboard.jsx` with top header, 3-section nav (Orders, Inventory, Leaderboard), premium micro-animations, no card borders.

- [x] **Step 2: Implement Order Management**
Orders view fetches `/api/staff/orders` with All/My Cases filter. Stage stepper with color-coded dots (Received -> CAD Design -> Milling -> QC -> Dispatched -> Completed).

- [x] **Step 3: Build Mobile Staff View**
Ponytail: StaffDashboard is already responsive with CSS media queries + mobile bottom nav. No separate MobileStaffDashboard needed.

- [x] **Step 4: Route the Staff Portal**
Created `/staff/dashboard` route page. Updated `page.jsx` to redirect staff users. Fixed login components to redirect to `/staff/dashboard`.

- [x] **Step 5: Commit**
Combined frontend epic commit.

---

### Task 4: Frontend - Inventory & Leaderboard (Gamification)

**Files:**
- Already in: `frontend/src/staff/StaffDashboard.jsx` (built together with Task 3, ponytail: no separate step)

**Interfaces:**
- Consumes: `GET /api/staff/inventory`

- [x] **Step 1: Build Inventory Tracker**
Inventory view with item list, +/- stock adjustment buttons, "Add Item" modal, LOW STOCK alerts. No card borders (shadows only).

- [x] **Step 2: Build Leaderboard/Gamification Widget**
"My Performance" view with metric cards: Cases This Month, Days Present, Half Days. Hover-lift animations on cards.

- [x] **Step 3: Ensure strict UI Rules**
Verified: zero emojis, all cards use box-shadows only (no borders), clean typography, micro-animations on hover.

- [x] **Step 4: Final Build & Verification**
`npm run build` passed: compiled successfully, 14/14 pages generated (including new `/staff/dashboard`), 0 errors.

- [x] **Step 5: Commit**
Combined frontend epic commit.

