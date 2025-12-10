-- Add is_deleted column to projects table for soft delete (quarantine)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Update existing projects to have is_deleted = false if null
UPDATE projects SET is_deleted = FALSE WHERE is_deleted IS NULL;
