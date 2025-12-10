-- ==============================================================================
-- Create Project Related Tables
-- ==============================================================================

-- 1. Project Team Members
CREATE TABLE IF NOT EXISTS public.project_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    role TEXT,
    allocation INTEGER DEFAULT 100,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Project Tasks
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo', -- todo, in_progress, review, done
    priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
    assignee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    assignee_name TEXT,
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Project Milestones
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    completed_date DATE,
    status TEXT DEFAULT 'pending', -- pending, completed, delayed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Project Activities
CREATE TABLE IF NOT EXISTS public.project_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Enable Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS Policies
-- ==============================================================================

-- Helper policy for facility access via project
-- Users can access these tables if they have access to the parent project's facility

-- Project Team Members Policies
CREATE POLICY "Facility users can view team members" ON public.project_team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_team_members.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

CREATE POLICY "Facility users can manage team members" ON public.project_team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_team_members.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

-- Project Tasks Policies
CREATE POLICY "Facility users can view tasks" ON public.project_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_tasks.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

CREATE POLICY "Facility users can manage tasks" ON public.project_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_tasks.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

-- Project Milestones Policies
CREATE POLICY "Facility users can view milestones" ON public.project_milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_milestones.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

CREATE POLICY "Facility users can manage milestones" ON public.project_milestones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_milestones.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

-- Project Activities Policies
CREATE POLICY "Facility users can view activities" ON public.project_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_activities.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

CREATE POLICY "Facility users can insert activities" ON public.project_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_activities.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );
