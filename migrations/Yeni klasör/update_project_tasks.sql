-- Rename title to name to match the frontend model
ALTER TABLE public.project_tasks RENAME COLUMN title TO name;

-- Add tags column
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'project_tasks';
