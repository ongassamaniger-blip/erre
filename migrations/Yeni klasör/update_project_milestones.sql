-- Rename title to name to match the frontend model
ALTER TABLE public.project_milestones RENAME COLUMN title TO name;

-- Update default value for status
ALTER TABLE public.project_milestones ALTER COLUMN status SET DEFAULT 'upcoming';

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'project_milestones';
