-- Dentzy Staff Management — Add Profile Fields
-- Run: npx wrangler d1 execute dentzy-db --local --file=./d1/migrate_staff_profile.sql

ALTER TABLE staff ADD COLUMN email TEXT DEFAULT '';
ALTER TABLE staff ADD COLUMN phone TEXT DEFAULT '';
ALTER TABLE staff ADD COLUMN dob TEXT DEFAULT '';
