-- Add is_active column to departments table
ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active
UPDATE departments SET is_active = true WHERE is_active IS NULL;
