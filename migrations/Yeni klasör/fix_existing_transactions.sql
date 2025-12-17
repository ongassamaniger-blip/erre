-- Update existing transactions to match budget transfer codes
UPDATE transactions t
SET 
  transaction_number = bt.code,
  description = 'Genel Merkez Bütçe Aktarımı - ' || bt.code
FROM budget_transfers bt
WHERE 
  t.amount = bt.amount
  AND t.date::date = bt.transfer_date::date
  AND t.facility_id = bt.to_facility_id
  AND t.type = 'income'
  AND (t.description ILIKE '%Bütçe Aktarımı%' OR t.description IS NULL)
  AND (t.transaction_number IS NULL OR t.transaction_number NOT LIKE 'BT-%');

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload config';
