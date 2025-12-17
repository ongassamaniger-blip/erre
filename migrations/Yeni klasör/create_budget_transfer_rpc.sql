-- Function to transfer budget from a source budget to a project budget atomically
CREATE OR REPLACE FUNCTION transfer_budget_to_project(
  p_source_budget_id UUID,
  p_project_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner to ensure permissions
AS $$
DECLARE
  v_source_budget RECORD;
  v_project_budget_id UUID;
  v_project_budget_amount DECIMAL;
  v_project RECORD;
  v_year INT;
  v_period TEXT;
  v_currency TEXT;
  v_facility_id UUID;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- 1. Lock and get source budget
  SELECT * INTO v_source_budget
  FROM budgets
  WHERE id = p_source_budget_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source budget not found';
  END IF;

  IF v_source_budget.total_amount - v_source_budget.spent_amount < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in source budget';
  END IF;

  -- Store common vars
  v_year := v_source_budget.year;
  v_period := v_source_budget.period;
  v_currency := v_source_budget.currency;
  v_facility_id := v_source_budget.facility_id;
  v_start_date := v_source_budget.start_date;
  v_end_date := v_source_budget.end_date;

  -- 2. Get or create project budget
  SELECT id, total_amount INTO v_project_budget_id, v_project_budget_amount
  FROM budgets
  WHERE project_id = p_project_id
    AND year = v_year
  LIMIT 1;

  IF v_project_budget_id IS NULL THEN
    -- Create new budget for project
    INSERT INTO budgets (
      name,
      total_amount,
      year,
      period,
      scope,
      project_id, -- scopeId
      currency,
      start_date,
      end_date,
      facility_id,
      status,
      created_by
    ) VALUES (
      'Project Budget ' || v_year,
      0, -- Initial amount, will add transfer amount later
      v_year,
      v_period,
      'project',
      p_project_id,
      v_currency,
      v_start_date,
      v_end_date,
      v_facility_id,
      'active',
      p_user_id
    ) RETURNING id INTO v_project_budget_id;
    
    v_project_budget_amount := 0;
  END IF;

  -- 3. Update source budget
  UPDATE budgets
  SET total_amount = total_amount - p_amount,
      updated_at = NOW()
  WHERE id = p_source_budget_id;

  -- 4. Update target budget
  UPDATE budgets
  SET total_amount = total_amount + p_amount,
      updated_at = NOW()
  WHERE id = v_project_budget_id;

  -- 5. Update project total budget
  UPDATE projects
  SET budget = COALESCE(budget, 0) + p_amount,
      updated_at = NOW()
  WHERE id = p_project_id;

  -- 6. Log activity (Optional: if you have an activity log table, insert here. 
  -- For now, we rely on the service to log to project_activities if needed, 
  -- but ideally it should be here. Let's assume project_activities exists based on service code)
  
  -- We return the updated budgets info
  RETURN jsonb_build_object(
    'source_budget_id', p_source_budget_id,
    'project_budget_id', v_project_budget_id,
    'transferred_amount', p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
