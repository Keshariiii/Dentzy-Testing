-- Migration: app_settings — generic key-value settings table
-- Run: npx wrangler d1 execute dentzy-db --local --file=./d1/migrate_app_settings.sql

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT DEFAULT 'admin'
);

-- Seed default dentist notice bar
INSERT OR IGNORE INTO app_settings (key, value, updated_at, updated_by)
VALUES (
    'dentist_notice_bar',
    '{"enabled":true,"messages":["Welcome to Dentzy Clinical Lab Portal","Standard turnaround: 5-7 working days  |  Rush: 2-3 working days","New: Zirconia monolithic crowns with multi-shade gradients now available","Submit STL files for faster digital impression processing","Invoices are generated upon case dispatch — check the Payments tab","All cases backed by the Dentzy 1-Year Quality Guarantee","Lab support: Mon-Sat, 9 AM to 6 PM IST"]}',
    datetime('now'),
    'system'
);
