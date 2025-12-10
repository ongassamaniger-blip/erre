-- Add budget column to projects if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'budget') THEN
        ALTER TABLE projects ADD COLUMN budget NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Create project_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on project_activities
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for project_activities
DROP POLICY IF EXISTS "Enable read access for all users" ON project_activities;
CREATE POLICY "Enable read access for all users" ON project_activities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON project_activities;
CREATE POLICY "Enable insert access for authenticated users" ON project_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
