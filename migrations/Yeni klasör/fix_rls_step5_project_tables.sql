-- =============================================================================
-- ADIM 5: PROJECT TEAM, TASKS, MILESTONES, ACTIVITIES
-- =============================================================================

-- PROJECT_TEAM_MEMBERS tablosu - çoklu politikaları temizle
DROP POLICY IF EXISTS "Facility users can view team members" ON public.project_team_members;
DROP POLICY IF EXISTS "Facility users can manage team members" ON public.project_team_members;

CREATE POLICY "project_team_members_select_auth" ON public.project_team_members 
  FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "project_team_members_all_auth" ON public.project_team_members 
  FOR ALL USING ((select auth.role()) = 'authenticated');

-- PROJECT_TASKS tablosu - çoklu politikaları temizle
DROP POLICY IF EXISTS "Facility users can view tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "Facility users can manage tasks" ON public.project_tasks;

CREATE POLICY "project_tasks_select_auth" ON public.project_tasks 
  FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "project_tasks_all_auth" ON public.project_tasks 
  FOR ALL USING ((select auth.role()) = 'authenticated');

-- PROJECT_MILESTONES tablosu - çoklu politikaları temizle
DROP POLICY IF EXISTS "Facility users can view milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Facility users can manage milestones" ON public.project_milestones;

CREATE POLICY "project_milestones_select_auth" ON public.project_milestones 
  FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "project_milestones_all_auth" ON public.project_milestones 
  FOR ALL USING ((select auth.role()) = 'authenticated');

-- PROJECT_ACTIVITIES tablosu - çoklu politikaları temizle
DROP POLICY IF EXISTS "Enable read access for all users" ON public.project_activities;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.project_activities;
DROP POLICY IF EXISTS "Facility users can view activities" ON public.project_activities;
DROP POLICY IF EXISTS "Facility users can insert activities" ON public.project_activities;

CREATE POLICY "project_activities_select_all" ON public.project_activities 
  FOR SELECT USING (true);

CREATE POLICY "project_activities_insert_auth" ON public.project_activities 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'Adım 5 tamamlandı: project_team_members, project_tasks, project_milestones, project_activities düzeltildi' as status;
