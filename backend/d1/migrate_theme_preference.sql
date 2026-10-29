-- Migration: Add themePreference to users and staff tables
ALTER TABLE users ADD COLUMN themePreference TEXT DEFAULT 'system';
ALTER TABLE staff ADD COLUMN themePreference TEXT DEFAULT 'system';
