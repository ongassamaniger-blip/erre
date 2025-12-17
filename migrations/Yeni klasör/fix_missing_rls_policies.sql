-- =============================================================================
-- EKSİK RLS POLİTİKALARINI EKLE
-- =============================================================================

-- Activity Logs
DROP POLICY IF EXISTS "activity_logs_all" ON public.activity_logs;
CREATE POLICY "activity_logs_all" ON public.activity_logs 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Approval Requests
DROP POLICY IF EXISTS "approval_requests_all" ON public.approval_requests;
CREATE POLICY "approval_requests_all" ON public.approval_requests 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Approval Steps
DROP POLICY IF EXISTS "approval_steps_all" ON public.approval_steps;
CREATE POLICY "approval_steps_all" ON public.approval_steps 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Attendance Records
DROP POLICY IF EXISTS "attendance_records_all" ON public.attendance_records;
CREATE POLICY "attendance_records_all" ON public.attendance_records 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Chart of Accounts
DROP POLICY IF EXISTS "chart_of_accounts_all" ON public.chart_of_accounts;
CREATE POLICY "chart_of_accounts_all" ON public.chart_of_accounts 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Form Templates
DROP POLICY IF EXISTS "form_templates_all" ON public.form_templates;
CREATE POLICY "form_templates_all" ON public.form_templates 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Milestones
DROP POLICY IF EXISTS "milestones_all" ON public.milestones;
CREATE POLICY "milestones_all" ON public.milestones 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Payroll Records
DROP POLICY IF EXISTS "payroll_records_all" ON public.payroll_records;
CREATE POLICY "payroll_records_all" ON public.payroll_records 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Settings
DROP POLICY IF EXISTS "settings_all" ON public.settings;
CREATE POLICY "settings_all" ON public.settings 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Categories (Finans kategorileri için)
DROP POLICY IF EXISTS "categories_all" ON public.categories;
CREATE POLICY "categories_all" ON public.categories 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- Departments (Departmanlar için)
DROP POLICY IF EXISTS "departments_all" ON public.departments;
CREATE POLICY "departments_all" ON public.departments 
    FOR ALL USING ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'Eksik RLS politikaları eklendi!' as status;
