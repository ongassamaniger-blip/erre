-- =============================================================================
-- ADIM 9: FOREIGN KEY INDEX'LERI OLUŞTUR
-- =============================================================================
-- Bu index'ler JOIN ve WHERE sorgularında performansı artırır
-- =============================================================================

-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_facility_id ON public.activity_logs(facility_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);

-- approval_requests
CREATE INDEX IF NOT EXISTS idx_approval_requests_approver_id ON public.approval_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_facility_id ON public.approval_requests(facility_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester_id ON public.approval_requests(requester_id);

-- approval_steps
CREATE INDEX IF NOT EXISTS idx_approval_steps_approval_request_id ON public.approval_steps(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_approver_id ON public.approval_steps(approver_id);

-- attendance
CREATE INDEX IF NOT EXISTS idx_attendance_organization_id ON public.attendance(organization_id);

-- attendance_records
CREATE INDEX IF NOT EXISTS idx_attendance_records_facility_id ON public.attendance_records(facility_id);

-- budget_transfers
CREATE INDEX IF NOT EXISTS idx_budget_transfers_approved_by ON public.budget_transfers(approved_by);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_created_by ON public.budget_transfers(created_by);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_from_facility_id ON public.budget_transfers(from_facility_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_rejected_by ON public.budget_transfers(rejected_by);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_to_facility_id ON public.budget_transfers(to_facility_id);

-- budgets
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON public.budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_department_id ON public.budgets(department_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON public.budgets(project_id);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_facility_id ON public.categories(facility_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- chart_of_accounts
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_facility_id ON public.chart_of_accounts(facility_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_id ON public.chart_of_accounts(parent_id);

-- departments
CREATE INDEX IF NOT EXISTS idx_departments_facility_id ON public.departments(facility_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON public.departments(manager_id);

-- distribution_records
CREATE INDEX IF NOT EXISTS idx_distribution_records_campaign_id ON public.distribution_records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_distribution_records_facility_id ON public.distribution_records(facility_id);

-- employees
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_organization_id ON public.employees(organization_id);

-- facilities
CREATE INDEX IF NOT EXISTS idx_facilities_parent_facility_id ON public.facilities(parent_facility_id);

-- job_titles
CREATE INDEX IF NOT EXISTS idx_job_titles_department_id ON public.job_titles(department_id);
CREATE INDEX IF NOT EXISTS idx_job_titles_facility_id ON public.job_titles(facility_id);

-- leave_requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_approver_id ON public.leave_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_facility_id ON public.leave_requests(facility_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_organization_id ON public.leave_requests(organization_id);

-- milestones
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);

-- payroll_records
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON public.payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_facility_id ON public.payroll_records(facility_id);

-- payrolls
CREATE INDEX IF NOT EXISTS idx_payrolls_employee_id ON public.payrolls(employee_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_organization_id ON public.payrolls(organization_id);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

-- project_activities
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON public.project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_user_id ON public.project_activities(user_id);

-- project_categories
CREATE INDEX IF NOT EXISTS idx_project_categories_facility_id ON public.project_categories(facility_id);

-- project_documents
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_uploaded_by ON public.project_documents(uploaded_by);

-- project_milestones
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);

-- project_tasks
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee_id ON public.project_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);

-- project_team_members
CREATE INDEX IF NOT EXISTS idx_project_team_members_employee_id ON public.project_team_members(employee_id);

-- project_transactions
CREATE INDEX IF NOT EXISTS idx_project_transactions_created_by ON public.project_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_project_transactions_project_id ON public.project_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_transactions_transaction_id ON public.project_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_project_transactions_vendor_customer_id ON public.project_transactions(vendor_customer_id);

-- project_types
CREATE INDEX IF NOT EXISTS idx_project_types_facility_id ON public.project_types(facility_id);

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);

-- qurban_campaigns
CREATE INDEX IF NOT EXISTS idx_qurban_campaigns_facility_id ON public.qurban_campaigns(facility_id);

-- qurban_donations
CREATE INDEX IF NOT EXISTS idx_qurban_donations_facility_id ON public.qurban_donations(facility_id);

-- qurban_schedules
CREATE INDEX IF NOT EXISTS idx_qurban_schedules_facility_id ON public.qurban_schedules(facility_id);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

-- transactions
CREATE INDEX IF NOT EXISTS idx_transactions_approved_by ON public.transactions(approved_by);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_department_id ON public.transactions(department_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON public.transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_vendor_customer_id ON public.transactions(vendor_customer_id);

-- vendors_customers
CREATE INDEX IF NOT EXISTS idx_vendors_customers_facility_id ON public.vendors_customers(facility_id);
CREATE INDEX IF NOT EXISTS idx_vendors_customers_organization_id ON public.vendors_customers(organization_id);

-- Kullanılmayan index'i sil (opsiyonel)
-- DROP INDEX IF EXISTS idx_calendar_events_type;

-- =============================================================================
SELECT 'Adım 9 tamamlandı: Tüm foreign key index''leri oluşturuldu!' as status;
