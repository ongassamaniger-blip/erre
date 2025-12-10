-- Add 'collected' column to projects table to track actual income
ALTER TABLE projects ADD COLUMN IF NOT EXISTS collected NUMERIC DEFAULT 0;

-- Update existing projects to have 0 collected if null
UPDATE projects SET collected = 0 WHERE collected IS NULL;
