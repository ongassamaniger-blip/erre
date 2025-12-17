-- Function to delete a facility and all its related data
CREATE OR REPLACE FUNCTION delete_facility_cascade(target_facility_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete related data from all modules
  -- Finance
  DELETE FROM public.transactions WHERE facility_id = target_facility_id;
  DELETE FROM public.budgets WHERE facility_id = target_facility_id;
  DELETE FROM public.vendors_customers WHERE facility_id = target_facility_id;
  
  -- HR
  -- First delete leave requests (references employees)
  DELETE FROM public.leave_requests 
  WHERE employee_id IN (SELECT id FROM public.employees WHERE facility_id = target_facility_id);
  
  DELETE FROM public.employees WHERE facility_id = target_facility_id;
  DELETE FROM public.departments WHERE facility_id = target_facility_id;
  
  -- Projects
  DELETE FROM public.project_tasks 
  WHERE project_id IN (SELECT id FROM public.projects WHERE facility_id = target_facility_id);
  
  DELETE FROM public.project_milestones 
  WHERE project_id IN (SELECT id FROM public.projects WHERE facility_id = target_facility_id);
  
  DELETE FROM public.project_team_members 
  WHERE project_id IN (SELECT id FROM public.projects WHERE facility_id = target_facility_id);
  
  DELETE FROM public.projects WHERE facility_id = target_facility_id;
  
  -- Qurban
  DELETE FROM public.qurban_donations WHERE facility_id = target_facility_id;
  DELETE FROM public.qurban_campaigns WHERE facility_id = target_facility_id;
  
  -- Facility Users (Access)
  DELETE FROM public.facility_users WHERE facility_id = target_facility_id;
  
  -- Finally delete the facility itself
  DELETE FROM public.facilities WHERE id = target_facility_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
