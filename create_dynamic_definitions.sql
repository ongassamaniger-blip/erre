-- Project Categories
CREATE TABLE IF NOT EXISTS project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Types
CREATE TABLE IF NOT EXISTS project_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Titles (Positions)
CREATE TABLE IF NOT EXISTS job_titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_categories
CREATE POLICY "Read access for users in same facility" ON project_categories
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM facility_users WHERE facility_id = project_categories.facility_id
        ) OR facility_id IS NULL
    );

CREATE POLICY "Insert access for users in same facility" ON project_categories
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM facility_users WHERE facility_id = project_categories.facility_id
        )
    );

-- RLS Policies for project_types
CREATE POLICY "Read access for users in same facility" ON project_types
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM facility_users WHERE facility_id = project_types.facility_id
        ) OR facility_id IS NULL
    );

CREATE POLICY "Insert access for users in same facility" ON project_types
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM facility_users WHERE facility_id = project_types.facility_id
        )
    );

-- RLS Policies for job_titles
CREATE POLICY "Read access for users in same facility" ON job_titles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM facility_users WHERE facility_id = job_titles.facility_id
        ) OR facility_id IS NULL
    );

CREATE POLICY "Insert access for users in same facility" ON job_titles
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM facility_users WHERE facility_id = job_titles.facility_id
        )
    );
