-- Migration v14: Fix delivery_tasks.task_type, add DCI/CDSCO fields, and create CERT-In 180-day audit_logs table
-- Run locally:  npx wrangler d1 execute dentzy-db --local --file=./d1/migrate_v14_audit_and_fixes.sql
-- Run remotely: npx wrangler d1 execute dentzy-db --remote --file=./d1/migrate_v14_audit_and_fixes.sql

-- 1. Fix BUG-01: task_type already present on delivery_tasks
-- ALTER TABLE delivery_tasks ADD COLUMN task_type TEXT DEFAULT 'delivery';
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_order_id ON delivery_tasks(order_id);

-- 2. Dental Council (DCI / SDC) registration number for Dentists
ALTER TABLE users ADD COLUMN dciNumber TEXT DEFAULT '';

-- 3. CDSCO raw material batch/lot traceability on lab_orders
ALTER TABLE lab_orders ADD COLUMN material_lot_no TEXT DEFAULT '';

-- 4. CERT-In 180-day persistent audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
