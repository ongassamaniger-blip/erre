-- Check if columns exist in transactions and donations tables
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name IN ('transactions', 'donations') 
    AND column_name IN ('exchange_rate', 'amount_in_try');
