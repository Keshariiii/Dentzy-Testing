-- Dentzy Database Migration: Backfill Missing Payments & Order Amounts
-- Run locally:  npx wrangler d1 execute dentzy-db --local --file=./d1/migrate_backfill_order_amounts.sql
-- Run remotely: npx wrangler d1 execute dentzy-db --remote --file=./d1/migrate_backfill_order_amounts.sql

-- 1. Insert missing payments records for any lab_orders lacking an entry in payments
INSERT INTO payments (id, ownerId, patientName, caseId, invoiceNumber, amount, currency, status, invoiceDate, dueDate, description, createdAt, updatedAt)
SELECT
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
    o.ownerId,
    o.patientName,
    o.caseId,
    'INV-' || o.caseId,
    (CASE 
        WHEN LOWER(o.serviceType) = 'crown' THEN 750
        WHEN LOWER(o.serviceType) = 'bridge' THEN 750
        WHEN LOWER(o.serviceType) = 'denture' THEN 1500
        WHEN LOWER(o.serviceType) = 'implant' THEN 1800
        WHEN LOWER(o.serviceType) = 'veneer' THEN 1800
        WHEN LOWER(o.serviceType) = 'retainer' THEN 1200
        ELSE 500
     END) * (CASE WHEN json_array_length(COALESCE(NULLIF(o.teeth_data, ''), '[]')) > 0 THEN json_array_length(COALESCE(NULLIF(o.teeth_data, ''), '[]')) ELSE 1 END),
    'INR',
    'Pending',
    o.createdAt,
    o.dueDate,
    '',
    o.createdAt,
    datetime('now')
FROM lab_orders o
LEFT JOIN payments p ON o.caseId = p.caseId AND o.ownerId = p.ownerId
WHERE p.id IS NULL;

-- 2. Update existing payment rows where amount is null or 0 based on matching order serviceType and tooth count
UPDATE payments
SET 
    amount = (
        SELECT (CASE 
            WHEN LOWER(o.serviceType) = 'crown' THEN 750
            WHEN LOWER(o.serviceType) = 'bridge' THEN 750
            WHEN LOWER(o.serviceType) = 'denture' THEN 1500
            WHEN LOWER(o.serviceType) = 'implant' THEN 1800
            WHEN LOWER(o.serviceType) = 'veneer' THEN 1800
            WHEN LOWER(o.serviceType) = 'retainer' THEN 1200
            ELSE 500
        END) * (CASE WHEN json_array_length(COALESCE(NULLIF(o.teeth_data, ''), '[]')) > 0 THEN json_array_length(COALESCE(NULLIF(o.teeth_data, ''), '[]')) ELSE 1 END)
        FROM lab_orders o
        WHERE o.caseId = payments.caseId AND o.ownerId = payments.ownerId
    ),
    updatedAt = datetime('now')
WHERE (amount IS NULL OR amount <= 0)
  AND EXISTS (SELECT 1 FROM lab_orders o WHERE o.caseId = payments.caseId AND o.ownerId = payments.ownerId);
