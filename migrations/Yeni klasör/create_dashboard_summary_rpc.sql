-- Function to calculate dashboard summary with date filtering
CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_facility_id UUID,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Finance
  v_total_income DECIMAL := 0;
  v_total_expense DECIMAL := 0;
  v_net_income DECIMAL := 0;
  v_pending_transactions INT := 0;
  v_category_expenses JSONB := '[]'::jsonb;
  v_category_incomes JSONB := '[]'::jsonb;
  
  -- Date Logic for Comparison
  v_prev_start_date TIMESTAMP;
  v_prev_end_date TIMESTAMP;
  v_duration INTERVAL;
  
  -- HR
  v_total_employees INT := 0;
  v_active_employees INT := 0;
  v_leave_count INT := 0;
  v_monthly_payroll DECIMAL := 0;
  
  -- Projects
  v_total_projects INT := 0;
  v_active_projects INT := 0;
  v_completed_projects INT := 0;
  v_total_budget DECIMAL := 0;
  v_total_spent DECIMAL := 0;
  v_overdue_tasks INT := 0;
  
  -- Qurban
  v_total_shares INT := 0;
  v_total_donations DECIMAL := 0;
  v_slaughtered_count INT := 0;
  v_distributed_count INT := 0;
  v_total_donors INT := 0;
  
BEGIN
  -- Determine Previous Period for Comparison
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_duration := p_end_date - p_start_date;
    v_prev_end_date := p_start_date - INTERVAL '1 second';
    v_prev_start_date := v_prev_end_date - v_duration;
  ELSE
    -- Default to previous month comparison if no dates provided (assuming "this month" context)
    v_prev_start_date := date_trunc('month', CURRENT_DATE - INTERVAL '1 month');
    v_prev_end_date := date_trunc('month', CURRENT_DATE) - INTERVAL '1 second';
  END IF;

  -- 1. Finance Calculations
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount_in_base_currency ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_in_base_currency ELSE 0 END), 0)
  INTO v_total_income, v_total_expense
  FROM transactions
  WHERE facility_id = p_facility_id 
    AND status = 'approved'
    AND (p_start_date IS NULL OR date >= p_start_date)
    AND (p_end_date IS NULL OR date <= p_end_date);
  
  v_net_income := v_total_income - v_total_expense;

  -- Pending Transactions
  SELECT COUNT(*) INTO v_pending_transactions 
  FROM transactions 
  WHERE facility_id = p_facility_id AND status = 'pending';

  -- Category Breakdown (Expenses)
  WITH current_period AS (
    SELECT category, SUM(amount_in_base_currency) as total
    FROM transactions
    WHERE facility_id = p_facility_id 
      AND type = 'expense'
      AND status = 'approved'
      AND (p_start_date IS NULL OR date >= p_start_date)
      AND (p_end_date IS NULL OR date <= p_end_date)
    GROUP BY category
  ),
  prev_period AS (
    SELECT category, SUM(amount_in_base_currency) as total
    FROM transactions
    WHERE facility_id = p_facility_id 
      AND type = 'expense'
      AND status = 'approved'
      AND date >= v_prev_start_date AND date <= v_prev_end_date
    GROUP BY category
  )
  SELECT jsonb_agg(jsonb_build_object(
    'category', c.category,
    'amount', c.total,
    'percentage', CASE WHEN v_total_expense > 0 THEN (c.total / v_total_expense) * 100 ELSE 0 END,
    'change', CASE 
                WHEN p.total IS NULL OR p.total = 0 THEN 100 -- New or 100% increase
                ELSE ((c.total - p.total) / p.total) * 100 
              END
  ))
  INTO v_category_expenses
  FROM current_period c
  LEFT JOIN prev_period p ON c.category = p.category;

  -- Category Breakdown (Incomes)
  WITH current_period AS (
    SELECT category, SUM(amount_in_base_currency) as total
    FROM transactions
    WHERE facility_id = p_facility_id 
      AND type = 'income'
      AND status = 'approved'
      AND (p_start_date IS NULL OR date >= p_start_date)
      AND (p_end_date IS NULL OR date <= p_end_date)
    GROUP BY category
  ),
  prev_period AS (
    SELECT category, SUM(amount_in_base_currency) as total
    FROM transactions
    WHERE facility_id = p_facility_id 
      AND type = 'income'
      AND status = 'approved'
      AND date >= v_prev_start_date AND date <= v_prev_end_date
    GROUP BY category
  )
  SELECT jsonb_agg(jsonb_build_object(
    'category', c.category,
    'amount', c.total,
    'percentage', CASE WHEN v_total_income > 0 THEN (c.total / v_total_income) * 100 ELSE 0 END,
    'change', CASE 
                WHEN p.total IS NULL OR p.total = 0 THEN 100 
                ELSE ((c.total - p.total) / p.total) * 100 
              END
  ))
  INTO v_category_incomes
  FROM current_period c
  LEFT JOIN prev_period p ON c.category = p.category;
  
  -- 2. HR Calculations
  SELECT COUNT(*) INTO v_total_employees FROM employees WHERE facility_id = p_facility_id;
  SELECT COUNT(*) INTO v_active_employees FROM employees WHERE facility_id = p_facility_id AND status = 'active';
  SELECT COUNT(*) INTO v_leave_count FROM employees WHERE facility_id = p_facility_id AND status = 'on-leave';
  
  -- Monthly Payroll
  SELECT COALESCE(SUM(salary), 0) INTO v_monthly_payroll 
  FROM employees 
  WHERE facility_id = p_facility_id AND status = 'active';
  
  -- 3. Projects Calculations
  SELECT COUNT(*) INTO v_total_projects FROM projects WHERE facility_id = p_facility_id;
  SELECT COUNT(*) INTO v_active_projects FROM projects WHERE facility_id = p_facility_id AND status = 'active';
  SELECT COUNT(*) INTO v_completed_projects FROM projects WHERE facility_id = p_facility_id AND status = 'completed';
  SELECT COALESCE(SUM(budget), 0), COALESCE(SUM(spent), 0) INTO v_total_budget, v_total_spent FROM projects WHERE facility_id = p_facility_id;
  
  -- Overdue Tasks
  BEGIN
    SELECT COUNT(*) INTO v_overdue_tasks 
    FROM tasks 
    WHERE project_id IN (SELECT id FROM projects WHERE facility_id = p_facility_id)
      AND status != 'completed'
      AND due_date < CURRENT_DATE;
  EXCEPTION WHEN OTHERS THEN
    v_overdue_tasks := 0;
  END;
  
  -- 4. Qurban Calculations
  SELECT 
    COALESCE(SUM(share_count), 0),
    COALESCE(SUM(amount), 0),
    COUNT(DISTINCT donor_name)
  INTO v_total_shares, v_total_donations, v_total_donors
  FROM qurban_donations
  WHERE facility_id = p_facility_id 
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
    AND qurban_type IN ('cow-share', 'camel-share');
  
  SELECT COALESCE(SUM(completed_animals), 0) INTO v_slaughtered_count FROM qurban_campaigns WHERE facility_id = p_facility_id;
  SELECT COALESCE(SUM(package_count), 0) INTO v_distributed_count FROM distribution_records WHERE facility_id = p_facility_id;

  -- Construct Result
  RETURN jsonb_build_object(
    'finance', jsonb_build_object(
      'totalIncome', v_total_income,
      'totalExpense', v_total_expense,
      'netIncome', v_net_income,
      'pendingTransactions', v_pending_transactions,
      'categoryExpenses', COALESCE(v_category_expenses, '[]'::jsonb),
      'categoryIncomes', COALESCE(v_category_incomes, '[]'::jsonb)
    ),
    'hr', jsonb_build_object(
      'totalEmployees', v_total_employees,
      'activeEmployees', v_active_employees,
      'leaveCount', v_leave_count,
      'monthlyPayroll', v_monthly_payroll
    ),
    'projects', jsonb_build_object(
      'totalProjects', v_total_projects,
      'activeProjects', v_active_projects,
      'completedProjects', v_completed_projects,
      'totalBudget', v_total_budget,
      'totalSpent', v_total_spent,
      'overdueTasks', v_overdue_tasks
    ),
    'qurban', jsonb_build_object(
      'totalShares', v_total_shares,
      'totalDonations', v_total_donations,
      'slaughteredCount', v_slaughtered_count,
      'distributedCount', v_distributed_count,
      'totalDonors', v_total_donors
    )
  );
END;
$$;
