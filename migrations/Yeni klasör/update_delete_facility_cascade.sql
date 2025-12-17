-- ==============================================================================
-- Function: delete_facility_cascade
-- Description: Deletes a facility and all its related data in the correct order
--              to avoid foreign key constraint violations.
-- Updated: To include project_categories, project_types, job_titles
-- Usage: SELECT delete_facility_cascade('facility_uuid');
-- ==============================================================================

CREATE OR REPLACE FUNCTION delete_facility_cascade(target_facility_id UUID)
RETURNS VOID AS $$
BEGIN
  -- 1. Delete Finance Data (Transactions, Budgets, Transfers)
  -- These reference Categories, Departments, Projects, Vendors
  DELETE FROM public.budget_transfers WHERE from_facility_id = target_facility_id OR to_facility_id = target_facility_id;
  DELETE FROM public.transactions WHERE facility_id = target_facility_id;
  DELETE FROM public.budgets WHERE facility_id = target_facility_id;

  -- 2. Delete Projects and Project Definitions
  -- Projects reference Employees (manager) and Facilities
  -- Deleting projects will cascade to tasks, milestones, team_members, documents, activities
  DELETE FROM public.projects WHERE facility_id = target_facility_id;
  
  -- Delete Project Definitions (New tables)
  -- These have ON DELETE CASCADE in schema, but we include them here for completeness/safety
  DELETE FROM public.project_categories WHERE facility_id = target_facility_id;
  DELETE FROM public.project_types WHERE facility_id = target_facility_id;

  -- 3. Delete HR Data
  -- Delete dependent records first
  DELETE FROM public.payroll_records WHERE facility_id = target_facility_id;
  DELETE FROM public.attendance_records WHERE facility_id = target_facility_id;
  DELETE FROM public.leave_requests WHERE facility_id = target_facility_id;
  
  -- Delete Job Titles (New table)
  DELETE FROM public.job_titles WHERE facility_id = target_facility_id;
  
  -- Delete Employees (referenced by Projects - but projects are deleted now)
  DELETE FROM public.employees WHERE facility_id = target_facility_id;
  
  -- Delete Departments (referenced by Employees, Budgets, Transactions)
  DELETE FROM public.departments WHERE facility_id = target_facility_id;

  -- 4. Delete Qurban Data
  DELETE FROM public.distribution_records WHERE facility_id = target_facility_id;
  DELETE FROM public.qurban_schedules WHERE facility_id = target_facility_id;
  DELETE FROM public.qurban_donations WHERE facility_id = target_facility_id;
  DELETE FROM public.qurban_campaigns WHERE facility_id = target_facility_id;

  -- 5. Delete System/Settings Data
  DELETE FROM public.approval_requests WHERE facility_id = target_facility_id;
  DELETE FROM public.activity_logs WHERE facility_id = target_facility_id;
  DELETE FROM public.settings WHERE facility_id = target_facility_id;

  -- 6. Delete Master Data
  -- These are referenced by Transactions, Budgets, etc. (which are deleted now)
  DELETE FROM public.chart_of_accounts WHERE facility_id = target_facility_id;
  DELETE FROM public.vendors_customers WHERE facility_id = target_facility_id;
  DELETE FROM public.categories WHERE facility_id = target_facility_id;

  -- 7. Finally Delete the Facility
  -- facility_users has ON DELETE CASCADE, so it will be cleaned up automatically
  DELETE FROM public.facilities WHERE id = target_facility_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
