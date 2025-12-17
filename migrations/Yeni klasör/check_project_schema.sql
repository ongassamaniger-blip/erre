-- Check projects table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects';

-- Check project_activities table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'project_activities';
