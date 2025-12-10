-- =============================================================================
-- TÜM TABLOLAR İÇİN KAPSAMLI RLS DÜZELTMESİ
-- =============================================================================
-- Bu script tüm tablolar için RLS politikalarını düzeltir
-- Supabase SQL Editor'da çalıştırın
-- =============================================================================

-- 1. EMPLOYEES
DROP POLICY IF EXISTS "employees_all" ON public.employees;
DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "employees_delete" ON public.employees;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees_select" ON public.employees FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "employees_insert" ON public.employees FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "employees_update" ON public.employees FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "employees_delete" ON public.employees FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 2. DEPARTMENTS
DROP POLICY IF EXISTS "departments_all" ON public.departments;
DROP POLICY IF EXISTS "departments_select" ON public.departments;
DROP POLICY IF EXISTS "departments_insert" ON public.departments;
DROP POLICY IF EXISTS "departments_update" ON public.departments;
DROP POLICY IF EXISTS "departments_delete" ON public.departments;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments_select" ON public.departments FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "departments_insert" ON public.departments FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "departments_update" ON public.departments FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "departments_delete" ON public.departments FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 3. JOB_TITLES
DROP POLICY IF EXISTS "job_titles_all" ON public.job_titles;
DROP POLICY IF EXISTS "job_titles_select" ON public.job_titles;
DROP POLICY IF EXISTS "job_titles_insert" ON public.job_titles;
DROP POLICY IF EXISTS "job_titles_update" ON public.job_titles;
DROP POLICY IF EXISTS "job_titles_delete" ON public.job_titles;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_titles_select" ON public.job_titles FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "job_titles_insert" ON public.job_titles FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "job_titles_update" ON public.job_titles FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "job_titles_delete" ON public.job_titles FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 4. LEAVE_REQUESTS
DROP POLICY IF EXISTS "leave_requests_all" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_select" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_update" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_delete" ON public.leave_requests;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leave_requests_select" ON public.leave_requests FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "leave_requests_insert" ON public.leave_requests FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "leave_requests_update" ON public.leave_requests FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "leave_requests_delete" ON public.leave_requests FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 5. PAYROLL_RECORDS
DROP POLICY IF EXISTS "payroll_records_all" ON public.payroll_records;
DROP POLICY IF EXISTS "payroll_records_select" ON public.payroll_records;
DROP POLICY IF EXISTS "payroll_records_insert" ON public.payroll_records;
DROP POLICY IF EXISTS "payroll_records_update" ON public.payroll_records;
DROP POLICY IF EXISTS "payroll_records_delete" ON public.payroll_records;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_records_select" ON public.payroll_records FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "payroll_records_insert" ON public.payroll_records FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "payroll_records_update" ON public.payroll_records FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "payroll_records_delete" ON public.payroll_records FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 6. ATTENDANCE
DROP POLICY IF EXISTS "attendance_all" ON public.attendance;
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete" ON public.attendance;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "attendance_insert" ON public.attendance FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "attendance_update" ON public.attendance FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "attendance_delete" ON public.attendance FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 7. VENDORS_CUSTOMERS
DROP POLICY IF EXISTS "vendors_customers_all" ON public.vendors_customers;
DROP POLICY IF EXISTS "vendors_customers_select" ON public.vendors_customers;
DROP POLICY IF EXISTS "vendors_customers_insert" ON public.vendors_customers;
DROP POLICY IF EXISTS "vendors_customers_update" ON public.vendors_customers;
DROP POLICY IF EXISTS "vendors_customers_delete" ON public.vendors_customers;
ALTER TABLE public.vendors_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors_customers_select" ON public.vendors_customers FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "vendors_customers_insert" ON public.vendors_customers FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "vendors_customers_update" ON public.vendors_customers FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "vendors_customers_delete" ON public.vendors_customers FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 8. CATEGORIES
DROP POLICY IF EXISTS "categories_all" ON public.categories;
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 9. TRANSACTIONS
DROP POLICY IF EXISTS "transactions_all" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 10. BUDGETS
DROP POLICY IF EXISTS "budgets_all" ON public.budgets;
DROP POLICY IF EXISTS "budgets_select" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update" ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete" ON public.budgets;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_select" ON public.budgets FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 11. PROJECTS
DROP POLICY IF EXISTS "projects_all" ON public.projects;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 12. PROJECT_TASKS
DROP POLICY IF EXISTS "project_tasks_all" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_select" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_insert" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_update" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_delete" ON public.project_tasks;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_tasks_select" ON public.project_tasks FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "project_tasks_insert" ON public.project_tasks FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "project_tasks_update" ON public.project_tasks FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "project_tasks_delete" ON public.project_tasks FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 13. QURBAN_CAMPAIGNS
DROP POLICY IF EXISTS "qurban_campaigns_all" ON public.qurban_campaigns;
DROP POLICY IF EXISTS "qurban_campaigns_select" ON public.qurban_campaigns;
DROP POLICY IF EXISTS "qurban_campaigns_insert" ON public.qurban_campaigns;
DROP POLICY IF EXISTS "qurban_campaigns_update" ON public.qurban_campaigns;
DROP POLICY IF EXISTS "qurban_campaigns_delete" ON public.qurban_campaigns;
ALTER TABLE public.qurban_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qurban_campaigns_select" ON public.qurban_campaigns FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "qurban_campaigns_insert" ON public.qurban_campaigns FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "qurban_campaigns_update" ON public.qurban_campaigns FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "qurban_campaigns_delete" ON public.qurban_campaigns FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 14. QURBAN_DONATIONS
DROP POLICY IF EXISTS "qurban_donations_all" ON public.qurban_donations;
DROP POLICY IF EXISTS "qurban_donations_select" ON public.qurban_donations;
DROP POLICY IF EXISTS "qurban_donations_insert" ON public.qurban_donations;
DROP POLICY IF EXISTS "qurban_donations_update" ON public.qurban_donations;
DROP POLICY IF EXISTS "qurban_donations_delete" ON public.qurban_donations;
ALTER TABLE public.qurban_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qurban_donations_select" ON public.qurban_donations FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "qurban_donations_insert" ON public.qurban_donations FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "qurban_donations_update" ON public.qurban_donations FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "qurban_donations_delete" ON public.qurban_donations FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 15. CALENDAR_EVENTS
DROP POLICY IF EXISTS "calendar_events_all" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_select" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_insert" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_update" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_delete" ON public.calendar_events;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_events_select" ON public.calendar_events FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "calendar_events_insert" ON public.calendar_events FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "calendar_events_update" ON public.calendar_events FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "calendar_events_delete" ON public.calendar_events FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 16. NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 17. PROJECT_CATEGORIES
DROP POLICY IF EXISTS "project_categories_all" ON public.project_categories;
DROP POLICY IF EXISTS "project_categories_select" ON public.project_categories;
DROP POLICY IF EXISTS "project_categories_insert" ON public.project_categories;
DROP POLICY IF EXISTS "project_categories_update" ON public.project_categories;
DROP POLICY IF EXISTS "project_categories_delete" ON public.project_categories;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_categories_select" ON public.project_categories FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "project_categories_insert" ON public.project_categories FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "project_categories_update" ON public.project_categories FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "project_categories_delete" ON public.project_categories FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 18. PROJECT_TYPES
DROP POLICY IF EXISTS "project_types_all" ON public.project_types;
DROP POLICY IF EXISTS "project_types_select" ON public.project_types;
DROP POLICY IF EXISTS "project_types_insert" ON public.project_types;
DROP POLICY IF EXISTS "project_types_update" ON public.project_types;
DROP POLICY IF EXISTS "project_types_delete" ON public.project_types;
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_types_select" ON public.project_types FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "project_types_insert" ON public.project_types FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "project_types_update" ON public.project_types FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "project_types_delete" ON public.project_types FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 19. APPROVAL_REQUESTS
DROP POLICY IF EXISTS "approval_requests_all" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_select" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_insert" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_update" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_delete" ON public.approval_requests;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_requests_select" ON public.approval_requests FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "approval_requests_insert" ON public.approval_requests FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "approval_requests_update" ON public.approval_requests FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "approval_requests_delete" ON public.approval_requests FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 20. FACILITIES
DROP POLICY IF EXISTS "facilities_all" ON public.facilities;
DROP POLICY IF EXISTS "facilities_select" ON public.facilities;
DROP POLICY IF EXISTS "facilities_insert" ON public.facilities;
DROP POLICY IF EXISTS "facilities_update" ON public.facilities;
DROP POLICY IF EXISTS "facilities_delete" ON public.facilities;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facilities_select" ON public.facilities FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "facilities_insert" ON public.facilities FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "facilities_update" ON public.facilities FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "facilities_delete" ON public.facilities FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 21. PROFILES
DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING ((select auth.role()) = 'authenticated');
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'TÜM RLS politikaları başarıyla güncellendi!' as status;
