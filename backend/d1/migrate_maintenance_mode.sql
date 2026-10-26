-- Migration: Seed maintenance_mode in app_settings
-- ponytail: Store maintenance mode state in existing app_settings table to avoid schema churn.
-- Run: npx wrangler d1 execute dentzy-db --local --file=./d1/migrate_maintenance_mode.sql

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT DEFAULT 'admin'
);

INSERT OR IGNORE INTO app_settings (key, value, updated_at, updated_by)
VALUES (
    'maintenance_mode',
    '{"enabled":false,"target":"both","customMessage":"We are upgrading our ceramic CAD/CAM milling server to serve your clinic faster.","estimatedTime":"Expected back online: Today at 6:00 PM IST","showEmergencyContact":true}',
    datetime('now'),
    'system'
);
