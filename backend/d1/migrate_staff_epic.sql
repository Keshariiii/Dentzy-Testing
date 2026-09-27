-- Staff Epic Migration
-- Run: npx wrangler d1 execute dentzy-db --remote --file=./d1/migrate_staff_epic.sql

-- Attendance tracking (admin manually marks per day)
CREATE TABLE IF NOT EXISTS staff_attendance (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Half-day')),
    logged_by_admin TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON staff_attendance(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON staff_attendance(staff_id, date);

-- Inventory for raw materials tracking
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'pcs',
    min_stock INTEGER DEFAULT 0,
    updated_by TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Gamification: track which staff member processed a case
ALTER TABLE lab_orders ADD COLUMN assigned_staff_id TEXT DEFAULT NULL;
