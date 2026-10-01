-- Migration: Update staff employee IDs from padded (e.g. 0001) to single/increasing numbers (1, 2, ...)
-- Run locally: npx wrangler d1 execute dentzy-db --local --file=./d1/migrate_staff_employee_numbers.sql
-- Run remote:  npx wrangler d1 execute dentzy-db --remote --file=./d1/migrate_staff_employee_numbers.sql

UPDATE staff 
SET employeeId = CAST(CAST(employeeId AS INTEGER) AS TEXT) 
WHERE employeeId IS NOT NULL AND employeeId != '';
