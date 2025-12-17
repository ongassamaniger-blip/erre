-- Performance Optimization Indexes
-- Bu migration dosyası performans için kritik index'leri ekler

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_facility_date 
ON public.transactions(facility_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_status 
ON public.transactions(status) 
WHERE status IN ('pending', 'approved', 'rejected');

CREATE INDEX IF NOT EXISTS idx_transactions_type_facility 
ON public.transactions(type, facility_id);

CREATE INDEX IF NOT EXISTS idx_transactions_category 
ON public.transactions(category_id) 
WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_project 
ON public.transactions(project_id) 
WHERE project_id IS NOT NULL;

-- Budgets table indexes
CREATE INDEX IF NOT EXISTS idx_budgets_facility_status 
ON public.budgets(facility_id, status);

CREATE INDEX IF NOT EXISTS idx_budgets_year_period 
ON public.budgets(year, period);

CREATE INDEX IF NOT EXISTS idx_budgets_department 
ON public.budgets(department_id) 
WHERE department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_budgets_project 
ON public.budgets(project_id) 
WHERE project_id IS NOT NULL;

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_facility_status 
ON public.projects(facility_id, status) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_projects_status 
ON public.projects(status) 
WHERE is_deleted = false;

-- Employees table indexes
CREATE INDEX IF NOT EXISTS idx_employees_facility_status 
ON public.employees(facility_id, status);

CREATE INDEX IF NOT EXISTS idx_employees_department 
ON public.employees(department) 
WHERE department IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_employees_email 
ON public.employees(email) 
WHERE email IS NOT NULL;

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_facility_status 
ON public.leave_requests(facility_id, status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee 
ON public.leave_requests(employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_dates 
ON public.leave_requests(start_date, end_date);

-- Payrolls indexes
CREATE INDEX IF NOT EXISTS idx_payrolls_facility_period 
ON public.payrolls(facility_id, period DESC);

CREATE INDEX IF NOT EXISTS idx_payrolls_employee 
ON public.payrolls(employee_id);

CREATE INDEX IF NOT EXISTS idx_payrolls_status 
ON public.payrolls(status);

-- Project tasks indexes
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_status 
ON public.project_tasks(project_id, status);

CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date 
ON public.project_tasks(due_date) 
WHERE status != 'completed';

-- Qurban indexes
CREATE INDEX IF NOT EXISTS idx_qurban_campaigns_facility_status 
ON public.qurban_campaigns(facility_id, status);

CREATE INDEX IF NOT EXISTS idx_qurban_donations_facility_payment 
ON public.qurban_donations(facility_id, payment_status);

CREATE INDEX IF NOT EXISTS idx_qurban_donations_campaign 
ON public.qurban_donations(campaign_id);

-- Notifications indexes (already added in previous migration, but ensure they exist)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON public.notifications(created_at DESC);

-- Approval requests indexes
CREATE INDEX IF NOT EXISTS idx_approval_requests_facility_status 
ON public.approval_requests(facility_id, status);

CREATE INDEX IF NOT EXISTS idx_approval_requests_module 
ON public.approval_requests(module);

CREATE INDEX IF NOT EXISTS idx_approval_requests_priority 
ON public.approval_requests(priority) 
WHERE status = 'pending';

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_facility_date 
ON public.calendar_events(facility_id, start_date);

CREATE INDEX IF NOT EXISTS idx_calendar_events_type 
ON public.calendar_events(type);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_facility_type_date 
ON public.transactions(facility_id, type, date DESC);

CREATE INDEX IF NOT EXISTS idx_employees_facility_department_status 
ON public.employees(facility_id, department, status);

-- Partial indexes for active records (better performance)
CREATE INDEX IF NOT EXISTS idx_projects_active 
ON public.projects(facility_id, status) 
WHERE is_deleted = false AND status IN ('active', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_employees_active 
ON public.employees(facility_id, department) 
WHERE status = 'active';

