-- Dentzy v2 Core Migration
-- Run locally:  npx wrangler d1 execute dentzy-db --local --file=./d1/migrate_v2_core.sql
-- Run remotely: npx wrangler d1 execute dentzy-db --remote --file=./d1/migrate_v2_core.sql

-- 1. Extend lab_orders with order intake fields and credit control
ALTER TABLE lab_orders ADD COLUMN teeth_data TEXT DEFAULT '[]';
ALTER TABLE lab_orders ADD COLUMN restoration_type TEXT DEFAULT 'Crown';
ALTER TABLE lab_orders ADD COLUMN service_category TEXT DEFAULT 'Ceramic';
ALTER TABLE lab_orders ADD COLUMN is_urgent INTEGER DEFAULT 0;
ALTER TABLE lab_orders ADD COLUMN credit_override INTEGER DEFAULT 0;
ALTER TABLE lab_orders ADD COLUMN credit_override_reason TEXT DEFAULT '';

-- 2. Delivery dispatch tracking table
CREATE TABLE IF NOT EXISTS delivery_tasks (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    rider_id TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned', 'in_progress', 'completed', 'failed')),
    clinic_name TEXT NOT NULL,
    address TEXT NOT NULL,
    contact_phone TEXT DEFAULT '',
    patient_name TEXT DEFAULT '',
    case_id TEXT NOT NULL,
    notes TEXT DEFAULT '',
    completed_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES lab_orders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_status ON delivery_tasks(status);
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_order ON delivery_tasks(order_id);

-- 3. Intern daily task management table
CREATE TABLE IF NOT EXISTS intern_tasks (
    id TEXT PRIMARY KEY,
    intern_id TEXT NOT NULL,
    supervisor_id TEXT DEFAULT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
    due_date TEXT NOT NULL,
    completion_notes TEXT DEFAULT '',
    verified INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (intern_id) REFERENCES staff(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_intern_tasks_intern ON intern_tasks(intern_id, status);

-- 4. Performance indexes (missing from original schema)
CREATE INDEX IF NOT EXISTS idx_payments_case_owner ON payments(caseId, ownerId);
CREATE INDEX IF NOT EXISTS idx_orders_created_desc ON lab_orders(createdAt);

-- 5. Staff broadcast notice bar seed in app_settings
INSERT OR IGNORE INTO app_settings (key, value, updated_at, updated_by)
VALUES (
    'staff_notice_bar',
    '{"enabled":true,"message":"Lab operational hours: 10 AM - 10 PM (Sunday Closed) | Vasai West Center"}',
    datetime('now'),
    'system'
);
