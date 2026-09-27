-- Staff Enhancements Migration
-- Adds email, designation, and employeeId columns to staff table

ALTER TABLE staff ADD COLUMN email TEXT DEFAULT '';
ALTER TABLE staff ADD COLUMN designation TEXT DEFAULT '';
ALTER TABLE staff ADD COLUMN employeeId TEXT DEFAULT '';
