-- =============================================================================
-- EMPLOYEES RLS POLİTİKASI DÜZELTMESİ
-- =============================================================================

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "employees_all" ON public.employees;
DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "employees_delete" ON public.employees;

-- RLS aktif olduğundan emin ol
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Yeni politikalar oluştur - authenticated kullanıcılar tüm işlemleri yapabilir
CREATE POLICY "employees_select" ON public.employees 
    FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "employees_insert" ON public.employees 
    FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "employees_update" ON public.employees 
    FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "employees_delete" ON public.employees 
    FOR DELETE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
-- Diğer İK tabloları için de kontrol edelim
-- =============================================================================

-- DEPARTMENTS
DROP POLICY IF EXISTS "departments_all" ON public.departments;
DROP POLICY IF EXISTS "departments_select" ON public.departments;
DROP POLICY IF EXISTS "departments_insert" ON public.departments;
DROP POLICY IF EXISTS "departments_update" ON public.departments;
DROP POLICY IF EXISTS "departments_delete" ON public.departments;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select" ON public.departments 
    FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "departments_insert" ON public.departments 
    FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "departments_update" ON public.departments 
    FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "departments_delete" ON public.departments 
    FOR DELETE USING ((select auth.role()) = 'authenticated');

-- LEAVE_REQUESTS
DROP POLICY IF EXISTS "leave_requests_all" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_select" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_update" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_delete" ON public.leave_requests;

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_requests_select" ON public.leave_requests 
    FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "leave_requests_insert" ON public.leave_requests 
    FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "leave_requests_update" ON public.leave_requests 
    FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "leave_requests_delete" ON public.leave_requests 
    FOR DELETE USING ((select auth.role()) = 'authenticated');

-- PAYROLL_RECORDS
DROP POLICY IF EXISTS "payroll_records_all" ON public.payroll_records;
DROP POLICY IF EXISTS "payroll_records_select" ON public.payroll_records;
DROP POLICY IF EXISTS "payroll_records_insert" ON public.payroll_records;
DROP POLICY IF EXISTS "payroll_records_update" ON public.payroll_records;
DROP POLICY IF EXISTS "payroll_records_delete" ON public.payroll_records;

ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_records_select" ON public.payroll_records 
    FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "payroll_records_insert" ON public.payroll_records 
    FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "payroll_records_update" ON public.payroll_records 
    FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "payroll_records_delete" ON public.payroll_records 
    FOR DELETE USING ((select auth.role()) = 'authenticated');

-- ATTENDANCE
DROP POLICY IF EXISTS "attendance_all" ON public.attendance;
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete" ON public.attendance;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select" ON public.attendance 
    FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "attendance_insert" ON public.attendance 
    FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "attendance_update" ON public.attendance 
    FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "attendance_delete" ON public.attendance 
    FOR DELETE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'HR modülü RLS politikaları güncellendi!' as status;
