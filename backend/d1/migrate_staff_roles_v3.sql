-- ponytail: Add department routing, QC/delivery timestamps, and covering indexes for role-based staff portal

-- 1. Extend lab_orders with explicit department routing and workflow timestamps
ALTER TABLE lab_orders ADD COLUMN assigned_department TEXT DEFAULT 'Ceramic';
ALTER TABLE lab_orders ADD COLUMN due_time TEXT DEFAULT '';
ALTER TABLE lab_orders ADD COLUMN qc_completed_at TEXT DEFAULT NULL;
ALTER TABLE lab_orders ADD COLUMN dispatched_at TEXT DEFAULT NULL;
ALTER TABLE lab_orders ADD COLUMN delivered_at TEXT DEFAULT NULL;

-- 2. Backfill assigned_department from existing service_category / restoration_type
UPDATE lab_orders
SET assigned_department = CASE
  WHEN LOWER(service_category) LIKE '%acrylic%' OR LOWER(serviceType) = 'denture' THEN 'Acrylic'
  WHEN LOWER(service_category) LIKE '%zirconia%' OR LOWER(service_category) LIKE '%cad%' THEN 'CAD/CAM'
  WHEN LOWER(service_category) LIKE '%milling%' THEN 'Milling'
  WHEN LOWER(service_category) LIKE '%sintering%' THEN 'Sintering'
  WHEN LOWER(service_category) LIKE '%print%' OR LOWER(service_category) LIKE '%3d%' THEN '3D Printing'
  ELSE 'Ceramic'
END
WHERE assigned_department IS NULL OR assigned_department = '';

-- 3. Normalize existing staff designations to canonical names
UPDATE staff SET designation = 'Ceramic' WHERE designation IN ('Ceramist', 'Ceramic Staff');
UPDATE staff SET designation = 'Acrylic' WHERE designation IN ('Acrylic Tech', 'Acrylic Staff');
UPDATE staff SET designation = 'CAD/CAM' WHERE designation IN ('CAD/CAM Specialist', 'CAD/CAM Tech');
UPDATE staff SET designation = 'Delivery' WHERE designation IN ('Delivery Staff', 'Rider');

-- 4. Extend delivery_tasks with due_date and dentist_name for fast single-table reads
ALTER TABLE delivery_tasks ADD COLUMN dentist_name TEXT DEFAULT '';
ALTER TABLE delivery_tasks ADD COLUMN due_date TEXT DEFAULT NULL;

-- 5. Composite covering indexes for high-frequency role-based D1 queries
CREATE INDEX IF NOT EXISTS idx_staff_designation_status ON staff(designation, status);
CREATE INDEX IF NOT EXISTS idx_orders_dept_stage_created ON lab_orders(assigned_department, stage, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff_stage ON lab_orders(assigned_staff_id, stage, updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stage_updated ON lab_orders(stage, updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_owner_created ON lab_orders(ownerId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_status_created ON delivery_tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_owner_status_created ON payments(ownerId, status, createdAt DESC);
