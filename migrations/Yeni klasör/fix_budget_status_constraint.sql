-- Drop the existing constraint
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_status_check;

-- Add the new constraint including 'pending'
ALTER TABLE budgets ADD CONSTRAINT budgets_status_check 
CHECK (status IN ('active', 'completed', 'exceeded', 'draft', 'cancelled', 'pending'));
