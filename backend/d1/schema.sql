-- Dentzy D1 Schema — SQLite relational tables
-- Run: npx wrangler d1 execute dentzy-db --local --file=./d1/schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    adminNote TEXT DEFAULT '',
    dob TEXT DEFAULT NULL,
    phone TEXT DEFAULT '',
    clinicName TEXT DEFAULT '',
    address TEXT DEFAULT '',
    dciNumber TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS lab_orders (
    id TEXT PRIMARY KEY,
    ownerId TEXT NOT NULL,
    patientName TEXT NOT NULL,
    caseId TEXT NOT NULL UNIQUE,
    serviceType TEXT NOT NULL DEFAULT 'Other',
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    stage TEXT NOT NULL DEFAULT 'received' CHECK(stage IN ('received', 'design', 'production', 'qc', 'dispatched', 'completed')),
    dueDate TEXT,
    notes TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'Normal' CHECK(priority IN ('Low', 'Normal', 'High', 'Urgent')),
    createdBy TEXT NOT NULL DEFAULT 'admin',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    assigned_department TEXT DEFAULT 'Ceramic',
    assigned_staff_id TEXT DEFAULT NULL,
    due_time TEXT DEFAULT '',
    qc_completed_at TEXT DEFAULT NULL,
    dispatched_at TEXT DEFAULT NULL,
    delivered_at TEXT DEFAULT NULL,
    teeth_data TEXT DEFAULT '[]',
    restoration_type TEXT DEFAULT 'Crown',
    service_category TEXT DEFAULT 'Ceramic',
    is_urgent INTEGER DEFAULT 0,
    credit_override INTEGER DEFAULT 0,
    credit_override_reason TEXT DEFAULT '',
    material_lot_no TEXT DEFAULT '',
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_orders_ownerId ON lab_orders(ownerId);
CREATE INDEX IF NOT EXISTS idx_orders_caseId ON lab_orders(caseId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_desc ON lab_orders(createdAt);
CREATE INDEX IF NOT EXISTS idx_orders_dept_stage_created ON lab_orders(assigned_department, stage, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff_stage ON lab_orders(assigned_staff_id, stage, updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stage_updated ON lab_orders(stage, updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_owner_created ON lab_orders(ownerId, createdAt DESC);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    ownerId TEXT NOT NULL,
    patientName TEXT NOT NULL,
    caseId TEXT NOT NULL,
    invoiceNumber TEXT,
    amount REAL NOT NULL CHECK(amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Paid', 'Pending', 'Overdue', 'Cancelled')),
    invoiceDate TEXT NOT NULL,
    dueDate TEXT,
    description TEXT DEFAULT '',
    paymentMode TEXT DEFAULT '',
    referenceNumber TEXT DEFAULT '',
    paidAt TEXT DEFAULT NULL,
    batchId TEXT DEFAULT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_ownerId ON payments(ownerId);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_mode ON payments(paymentMode);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(referenceNumber);
CREATE INDEX IF NOT EXISTS idx_payments_batchId ON payments(batchId);
CREATE INDEX IF NOT EXISTS idx_payments_case_owner ON payments(caseId, ownerId);
CREATE INDEX IF NOT EXISTS idx_payments_owner_status_created ON payments(ownerId, status, createdAt DESC);

CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    subject TEXT DEFAULT '',
    message TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT NOT NULL,
    ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_ts ON rate_limits(key, ts);

CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL,
    displayName TEXT NOT NULL DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    dob TEXT DEFAULT '',
    designation TEXT DEFAULT '',
    employeeId TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_designation_status ON staff(designation, status);

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

-- Generic App Settings (Key-Value)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT DEFAULT 'admin'
);

-- Delivery dispatch tracking table
CREATE TABLE IF NOT EXISTS delivery_tasks (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    rider_id TEXT DEFAULT NULL,
    task_type TEXT DEFAULT 'delivery',
    status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned', 'in_progress', 'completed', 'failed')),
    clinic_name TEXT NOT NULL,
    dentist_name TEXT DEFAULT '',
    address TEXT NOT NULL,
    contact_phone TEXT DEFAULT '',
    patient_name TEXT DEFAULT '',
    case_id TEXT NOT NULL,
    notes TEXT DEFAULT '',
    due_date TEXT DEFAULT NULL,
    completed_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES lab_orders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_status ON delivery_tasks(status);
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_order ON delivery_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_order_id ON delivery_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_status_created ON delivery_tasks(status, created_at DESC);

-- Intern daily task management table
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

-- CERT-In 180-day persistent audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- -- Migrations Reference ---------------------------------------------------
-- v2: lab_orders extended, delivery_tasks, intern_tasks created
-- v3: delivery_tasks extended with dentist_name, due_date
-- v14: delivery_tasks.task_type, users.dciNumber, lab_orders.material_lot_no, audit_logs table

-- Seed maintenance_mode default setting
INSERT OR IGNORE INTO app_settings (key, value, updated_at, updated_by)
VALUES (
    'maintenance_mode',
    '{"enabled":false,"target":"both","customMessage":"We are upgrading our ceramic CAD/CAM milling server to serve your clinic faster.","estimatedTime":"Expected back online: Today at 6:00 PM IST","showEmergencyContact":true}',
    datetime('now'),
    'system'
);
