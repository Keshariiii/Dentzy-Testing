-- Plan 7 Migration: Add mode-specific payment columns to payments table
-- Run: npx wrangler d1 execute dentzy-db --remote --file=./d1/migrate_plan7.sql

ALTER TABLE payments ADD COLUMN paymentMode TEXT DEFAULT '';
ALTER TABLE payments ADD COLUMN referenceNumber TEXT DEFAULT '';
ALTER TABLE payments ADD COLUMN paidAt TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_mode ON payments(paymentMode);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(referenceNumber);
