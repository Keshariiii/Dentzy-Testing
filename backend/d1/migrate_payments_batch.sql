-- Migration: Add batchId column to payments table for multi-order consolidated invoicing
ALTER TABLE payments ADD COLUMN batchId TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_batchId ON payments(batchId);
