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
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_orders_ownerId ON lab_orders(ownerId);
CREATE INDEX IF NOT EXISTS idx_orders_caseId ON lab_orders(caseId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON lab_orders(status);

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
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_ownerId ON payments(ownerId);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

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
