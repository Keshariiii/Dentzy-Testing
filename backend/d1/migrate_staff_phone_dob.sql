-- Migration: Add phone and dob columns to staff table
-- Run: npx wrangler d1 execute dentzy-db --local --file=./d1/migrate_staff_phone_dob.sql

ALTER TABLE staff ADD COLUMN phone TEXT DEFAULT '';
ALTER TABLE staff ADD COLUMN dob TEXT DEFAULT '';
