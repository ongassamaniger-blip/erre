-- Add IBAN and Bank Name columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT;
