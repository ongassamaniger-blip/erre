-- Inspect columns of dependent tables
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('leave_requests', 'advance_requests', 'budget_transfers')
ORDER BY table_name, ordinal_position;
