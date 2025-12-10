
-- Update status check constraint on budgets table
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_status_check;
ALTER TABLE public.budgets ADD CONSTRAINT budgets_status_check 
  CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'pending', 'rejected', 'exceeded'));
