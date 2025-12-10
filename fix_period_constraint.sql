-- Drop the existing constraint
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_period_check;

-- Add the constraint with correct values
ALTER TABLE budgets 
ADD CONSTRAINT budgets_period_check 
CHECK (period IN ('yearly', 'quarterly', 'monthly'));

-- Notify to reload schema
NOTIFY pgrst, 'reload schema';
