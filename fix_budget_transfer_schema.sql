-- Add transfer_date column to budget_transfers table
ALTER TABLE budget_transfers 
ADD COLUMN IF NOT EXISTS transfer_date DATE DEFAULT CURRENT_DATE;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload config';
