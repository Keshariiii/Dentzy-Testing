# Staff Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Staff Management system by adding email, designations, auto-incrementing employee IDs, email confirmations, designation-grouped Admin UI with edit modals, and granting Staff access to manage Dentist data (orders and payments).

**Architecture:** Cloudflare Workers (Backend) + Next.js Static Export (Frontend). Database migrations via SQLite `ALTER TABLE`. UI uses ponytail engineering (minimal diff, reuse) and impeccable design (shadows only, no emojis, 21st.dev style).

**Tech Stack:** React, Next.js, Cloudflare Workers, Hono, D1 Database.

**Spec:** User Request 2026-09-27 (Staff Enhancements)

## Global Constraints

- **Ponytail Mode:** Full. YAGNI. Shortest working diff. Re-use existing patterns.
- **Impeccable UI:** Premium craft. Use 21st.dev for polished components. 
- **Strict UI Rules:** NO emojis anywhere. NO side/upper/lower border lines on any cards (use box-shadows only).
- **Email:** Stub/mock the email API fetch if no third-party API key is configured, but write the real structure for sending confirmation.

---

### Task 1: Backend - Schema Migration & Staff Model ✅

**Files:**
- Created: `backend/d1/migrate_staff_enhancements.sql`
- Modified: `backend/d1/schema.sql`

- [x] **Step 1: Write the schema migration** — Created migration SQL with ALTER TABLE for email, designation, employeeId
- [x] **Step 2: Update the main schema definition** — Updated schema.sql with new columns
- [x] **Step 3: Run the migration remotely** — Executed successfully on D1 (3 queries, 3 rows written)

---

### Task 2: Backend - Admin Staff API & Email Confirmation ✅

**Files:**
- Modified: `backend/src/routes/admin.js`
- Modified: `backend/src/validators/admin.js`
- Modified: `backend/src/utils/email.js`

- [x] **Step 1: Implement Employee ID generation & Staff Creation** — Auto-incrementing employeeId (0001, 0002, etc.)
- [x] **Step 2: Implement Email Confirmation** — Added `sendStaffWelcomeEmail` with fire-and-forget via `waitUntil`
- [x] **Step 3: Add Edit Staff API Endpoint** — `PATCH /api/admin/staff/:id` for email, designation, displayName
- [x] **Step 4: Verify** — Backend dry-run deploy succeeded

---

### Task 3: Backend - Staff API for Dentist Management ✅

**Files:**
- Modified: `backend/src/routes/staff.js`

- [x] **Step 1: Add Dentists & Payments listing endpoints** — `GET /api/staff/users`, `GET /api/staff/users/:id`, `GET /api/staff/payments`
- [x] **Step 2: Add full update endpoints** — `PATCH /api/staff/orders/:id`, `PATCH /api/staff/payments/:id`

---

### Task 4: Frontend - Admin Staff UI Enhancements ✅

**Files:**
- Modified: `frontend/src/admin/StaffManagementView.jsx`

- [x] **Step 1: Update Create Staff Modal** — Added Email and Designation (select) fields
- [x] **Step 2: Implement Designation-Grouped View** — Cards grid grouped by designation with hover effects
- [x] **Step 3: Implement Edit Staff Modal** — Full edit modal with displayName, email, designation
- [x] **Step 4: Verify** — `npm run build` passed (exit 0)

---

### Task 5: Frontend - Staff Dashboard Dentist Management ✅

**Files:**
- Modified: `frontend/src/staff/StaffDashboard.jsx`

- [x] **Step 1: Add "Dentists" Tab** — Added to NAV_ITEMS
- [x] **Step 2: Build Dentists Listing View** — Searchable card grid of approved dentists
- [x] **Step 3: Build Dentist Details (Orders & Payments)** — Sub-tabs with edit modals for orders and payments
- [x] **Step 4: Verify Final Build** — `npm run build` passed (exit 0)
