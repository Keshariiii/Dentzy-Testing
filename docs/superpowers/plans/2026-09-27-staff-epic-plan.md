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

- [ ] **Step 5: Commit**
```bash
git add backend/
git commit -m "feat(backend): staff epic db schemas, attendance, inventory and orders APIs"
```

---

### Task 2: Frontend - Admin Staff Management UI

**Files:**
- Modify: `frontend/src/admin/AdminDashboard.jsx`
- Modify: `frontend/src/views/mobile/MobileAdminDashboard.jsx`

**Interfaces:**
- Consumes: `POST /api/admin/staff/:id/attendance`
- Consumes: `GET /api/admin/staff/inventory` (New) and `GET /api/admin/staff/metrics` (New)

- [ ] **Step 1: Add "Create Staff" UI to Staff List**
In `AdminDashboard.jsx` (Staff View), add a clean modal for the admin to create new staff accounts (inputs: Display Name, Username, Password).

- [ ] **Step 2: Add "Mark Attendance" Action to Staff List**
In `AdminDashboard.jsx` (Staff View), add a clean, borderless modal (Impeccable style) triggered by a "Mark Attendance" button next to each staff member.

- [ ] **Step 3: Add Inventory & Metrics Oversight Views**
In the Staff section of `AdminDashboard.jsx`, add two sub-views or cards:
  1. **Inventory:** A read/write table mirroring the staff inventory, allowing Admin to audit or correct stock.
  2. **Metrics:** A leaderboard view showing attendance history and cases processed per staff member.

- [ ] **Step 4: Implement API calls**
Write the fetch calls to send `POST /api/admin/staff` (to create staff), `status` for attendance, and fetch metrics/inventory.

- [ ] **Step 5: Update Mobile Admin View**
Replicate the clean manual attendance modal and basic oversight stats in `MobileAdminDashboard.jsx`.

- [ ] **Step 6: Test UI rendering**
Run `npm run build` in frontend to ensure zero compilation errors. 

- [ ] **Step 7: Commit**
```bash
git add frontend/src/admin frontend/src/views/mobile
git commit -m "feat(admin): complete staff management UI with attendance, inventory, and metrics oversight"
```

---

### Task 3: Frontend - Staff Portal Shell & Orders (21st.dev UI)

**Files:**
- Create: `frontend/src/staff/StaffDashboard.jsx`
- Create: `frontend/src/views/mobile/MobileStaffDashboard.jsx`
- Modify: `frontend/src/app/page.jsx` or relevant routing to load Staff dashboard when `StaffAuthContext` is valid.

**Interfaces:**
- Consumes: `GET /api/staff/orders` and `PATCH /api/staff/orders/:id/stage`

- [ ] **Step 1: Build the Staff Shell**
Create `StaffDashboard.jsx` with a premium, minimalist sidebar/navbar. 3 sections: Orders, Inventory, Leaderboard. Use smooth micro-animations on hover. No card borders.

- [ ] **Step 2: Implement Order Management**
Fetch `/api/staff/orders`. Render a board or list of cases. Add a visually polished "Stage Updater" (e.g., a stepper from CAD Design -> Milling -> QC). 

- [ ] **Step 3: Build Mobile Staff View**
Create `MobileStaffDashboard.jsx` with a bottom tab navigation matching the 3 sections. Clean, tappable, borderless cards with soft shadows.

- [ ] **Step 4: Route the Staff Portal**
Connect the main layout/routing so logged-in staff land on `StaffDashboard` instead of `Login`.

- [ ] **Step 5: Commit**
```bash
git add frontend/
git commit -m "feat(staff): premium staff portal shell and order management UI"
```

---

### Task 4: Frontend - Inventory & Leaderboard (Gamification)

**Files:**
- Modify: `frontend/src/staff/StaffDashboard.jsx`
- Modify: `frontend/src/views/mobile/MobileStaffDashboard.jsx`

**Interfaces:**
- Consumes: `GET /api/staff/inventory`

- [ ] **Step 1: Build Inventory Tracker**
Add the Inventory view to the Staff Dashboard. A simple, elegant table/list of materials (Zirconia Discs, Powders) with quick + / - stock adjustment buttons.

- [ ] **Step 2: Build Leaderboard/Gamification Widget**
Add a "Cases Processed this Month" widget. Visually engaging (maybe a sleek progress ring or bar, utilizing 21st.dev design cues). Highlights "Staff of the Month" if applicable.

- [ ] **Step 3: Ensure strict UI Rules**
Double-check: no emojis in the leaderboard, no borders on the inventory cards or widget containers.

- [ ] **Step 4: Final Build & Verification**
Run `npm run build` to ensure the frontend compiles statically without errors.

- [ ] **Step 5: Commit**
```bash
git add frontend/
git commit -m "feat(staff): inventory tracking and gamification leaderboard"
```
