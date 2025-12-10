-- =============================================================================
-- ADIM 4: JOB_TITLES, PROJECT_CATEGORIES, PROJECT_TYPES, ATTENDANCE
-- =============================================================================

-- JOB_TITLES tablosu
DROP POLICY IF EXISTS "Read access for job_titles" ON public.job_titles;
DROP POLICY IF EXISTS "Insert access for job_titles" ON public.job_titles;

CREATE POLICY "job_titles_select_all" ON public.job_titles 
  FOR SELECT USING (true);

CREATE POLICY "job_titles_insert_auth" ON public.job_titles 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- PROJECT_CATEGORIES tablosu
DROP POLICY IF EXISTS "Read access for project_categories" ON public.project_categories;
DROP POLICY IF EXISTS "Insert access for project_categories" ON public.project_categories;

CREATE POLICY "project_categories_select_all" ON public.project_categories 
  FOR SELECT USING (true);

CREATE POLICY "project_categories_insert_auth" ON public.project_categories 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- PROJECT_TYPES tablosu
DROP POLICY IF EXISTS "Read access for project_types" ON public.project_types;
DROP POLICY IF EXISTS "Insert access for project_types" ON public.project_types;

CREATE POLICY "project_types_select_all" ON public.project_types 
  FOR SELECT USING (true);

CREATE POLICY "project_types_insert_auth" ON public.project_types 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- ATTENDANCE tablosu
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.attendance;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.attendance;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.attendance;

CREATE POLICY "attendance_insert_auth" ON public.attendance 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "attendance_update_auth" ON public.attendance 
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "attendance_delete_auth" ON public.attendance 
  FOR DELETE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'Adım 4 tamamlandı: job_titles, project_categories, project_types, attendance düzeltildi' as status;
