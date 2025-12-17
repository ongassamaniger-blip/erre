-- Fix and enhance get_dashboard_summary RPC function
-- This fixes activeProjects calculation and adds trend calculations

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
  v_income_change DECIMAL := 0;
  v_expense_change DECIMAL := 0;
  v_monthly_trend JSONB := '[]'::jsonb;
  
  -- Date Logic for Comparison
  v_prev_start_date TIMESTAMP;
  v_prev_end_date TIMESTAMP;
  v_duration INTERVAL;
  v_prev_total_income DECIMAL := 0;
  v_prev_total_expense DECIMAL := 0;
  
  -- HR
  v_total_employees INT := 0;
  v_active_employees INT := 0;
  v_leave_count INT := 0;
  v_monthly_payroll DECIMAL := 0;
  v_employee_change DECIMAL := 0;
  v_prev_active_employees INT := 0;
  
  -- Projects
  v_total_projects INT := 0;
  v_active_projects INT := 0;
  v_completed_projects INT := 0;
  v_total_budget DECIMAL := 0;
  v_total_spent DECIMAL := 0;
  v_project_change DECIMAL := 0;
  v_prev_total_projects INT := 0;
  
  -- Qurban
  v_total_shares INT := 0;
  v_total_donations DECIMAL := 0;
  v_slaughtered_count INT := 0;
  v_distributed_count INT := 0;
  v_total_donors INT := 0;
  v_share_change DECIMAL := 0;
  v_donation_change DECIMAL := 0;
  v_prev_total_shares INT := 0;
  v_prev_total_donations DECIMAL := 0;
  
BEGIN
  -- Determine Previous Period for Comparison
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_duration := p_end_date - p_start_date;
    v_prev_end_date := p_start_date - INTERVAL '1 second';
    v_prev_start_date := v_prev_end_date - v_duration;
  ELSE
    -- Default to current month vs previous month
    v_prev_start_date := date_trunc('month', CURRENT_DATE - INTERVAL '1 month');
    v_prev_end_date := date_trunc('month', CURRENT_DATE) - INTERVAL '1 second';
    p_start_date := date_trunc('month', CURRENT_DATE);
    p_end_date := date_trunc('month', CURRENT_DATE + INTERVAL '1 month') - INTERVAL '1 second';
  END IF;

  -- 1. Finance Calculations - Current Period
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

  -- Finance - Previous Period
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount_in_base_currency ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_in_base_currency ELSE 0 END), 0)
  INTO v_prev_total_income, v_prev_total_expense
  FROM transactions
  WHERE facility_id = p_facility_id 
    AND status = 'approved'
    AND date >= v_prev_start_date
    AND date <= v_prev_end_date;

  -- Calculate trends
  IF v_prev_total_income > 0 THEN
    v_income_change := ((v_total_income - v_prev_total_income) / v_prev_total_income) * 100;
  ELSIF v_total_income > 0 THEN
    v_income_change := 100;
  END IF;

  IF v_prev_total_expense > 0 THEN
    v_expense_change := ((v_total_expense - v_prev_total_expense) / v_prev_total_expense) * 100;
  ELSIF v_total_expense > 0 THEN
    v_expense_change := 100;
  END IF;

  -- Pending Transactions
  SELECT COUNT(*) INTO v_pending_transactions 
  FROM transactions 
  WHERE facility_id = p_facility_id AND status = 'pending';

  -- Monthly Trend (Last 6 months)
  WITH monthly_data AS (
    SELECT 
      date_trunc('month', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount_in_base_currency ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount_in_base_currency ELSE 0 END) as expense
    FROM transactions
    WHERE facility_id = p_facility_id 
      AND status = 'approved'
      AND date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
      AND date < date_trunc('month', CURRENT_DATE + INTERVAL '1 month')
    GROUP BY date_trunc('month', date)
    ORDER BY month
  )
  SELECT jsonb_agg(jsonb_build_object(
    'name', to_char(month, 'Mon'),
    'income', COALESCE(income, 0),
    'expense', COALESCE(expense, 0)
  ))
  INTO v_monthly_trend
  FROM monthly_data;

  -- Category Breakdown (Expenses)
  WITH current_period AS (
    SELECT 
      c.name as category,
      COALESCE(SUM(t.amount_in_base_currency), 0) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.facility_id = p_facility_id 
      AND t.type = 'expense'
      AND t.status = 'approved'
      AND (p_start_date IS NULL OR t.date >= p_start_date)
      AND (p_end_date IS NULL OR t.date <= p_end_date)
    GROUP BY c.name
  ),
  prev_period AS (
    SELECT 
      c.name as category,
      COALESCE(SUM(t.amount_in_base_currency), 0) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.facility_id = p_facility_id 
      AND t.type = 'expense'
      AND t.status = 'approved'
      AND t.date >= v_prev_start_date 
      AND t.date <= v_prev_end_date
    GROUP BY c.name
  )
  SELECT jsonb_agg(jsonb_build_object(
    'category', COALESCE(c.category, 'Diğer'),
    'amount', c.total,
    'percentage', CASE WHEN v_total_expense > 0 THEN (c.total / v_total_expense) * 100 ELSE 0 END,
    'change', CASE 
                WHEN p.total IS NULL OR p.total = 0 THEN CASE WHEN c.total > 0 THEN 100 ELSE 0 END
                ELSE ((c.total - p.total) / p.total) * 100 
              END
  ))
  INTO v_category_expenses
  FROM current_period c
  LEFT JOIN prev_period p ON c.category = p.category;

  -- Category Breakdown (Incomes)
  WITH current_period AS (
    SELECT 
      c.name as category,
      COALESCE(SUM(t.amount_in_base_currency), 0) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.facility_id = p_facility_id 
      AND t.type = 'income'
      AND t.status = 'approved'
      AND (p_start_date IS NULL OR t.date >= p_start_date)
      AND (p_end_date IS NULL OR t.date <= p_end_date)
    GROUP BY c.name
  ),
  prev_period AS (
    SELECT 
      c.name as category,
      COALESCE(SUM(t.amount_in_base_currency), 0) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.facility_id = p_facility_id 
      AND t.type = 'income'
      AND t.status = 'approved'
      AND t.date >= v_prev_start_date 
      AND t.date <= v_prev_end_date
    GROUP BY c.name
  )
  SELECT jsonb_agg(jsonb_build_object(
    'category', COALESCE(c.category, 'Diğer'),
    'amount', c.total,
    'percentage', CASE WHEN v_total_income > 0 THEN (c.total / v_total_income) * 100 ELSE 0 END,
    'change', CASE 
                WHEN p.total IS NULL OR p.total = 0 THEN CASE WHEN c.total > 0 THEN 100 ELSE 0 END
                ELSE ((c.total - p.total) / p.total) * 100 
              END
  ))
  INTO v_category_incomes
  FROM current_period c
  LEFT JOIN prev_period p ON c.category = p.category;
  
  -- 2. HR Calculations
  SELECT COUNT(*) INTO v_total_employees 
  FROM employees 
  WHERE facility_id = p_facility_id 
    AND status != 'deleted';
    
  SELECT COUNT(*) INTO v_active_employees 
  FROM employees 
  WHERE facility_id = p_facility_id 
    AND status = 'active';
    
  SELECT COUNT(*) INTO v_leave_count 
  FROM leave_requests 
  WHERE facility_id = p_facility_id 
    AND status = 'approved'
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE;
  
  -- Monthly Payroll
  SELECT COALESCE(SUM(salary), 0) INTO v_monthly_payroll 
  FROM employees 
  WHERE facility_id = p_facility_id 
    AND status = 'active';
  
  -- Previous month active employees (approximation)
  SELECT COUNT(*) INTO v_prev_active_employees
  FROM employees
  WHERE facility_id = p_facility_id
    AND status = 'active'
    AND created_at <= v_prev_end_date;
  
  IF v_prev_active_employees > 0 THEN
    v_employee_change := ((v_active_employees::DECIMAL - v_prev_active_employees::DECIMAL) / v_prev_active_employees::DECIMAL) * 100;
  ELSIF v_active_employees > 0 THEN
    v_employee_change := 100;
  END IF;
  
  -- 3. Projects Calculations
  -- Fix: Check for both 'active' and 'in_progress' status
  SELECT COUNT(*) INTO v_total_projects 
  FROM projects 
  WHERE facility_id = p_facility_id
    AND (is_deleted IS NULL OR is_deleted = false);
    
  SELECT COUNT(*) INTO v_active_projects 
  FROM projects 
  WHERE facility_id = p_facility_id 
    AND (status = 'active' OR status = 'in_progress')
    AND (is_deleted IS NULL OR is_deleted = false);
    
  SELECT COUNT(*) INTO v_completed_projects 
  FROM projects 
  WHERE facility_id = p_facility_id 
    AND status = 'completed'
    AND (is_deleted IS NULL OR is_deleted = false);
    
  SELECT 
    COALESCE(SUM(budget), 0), 
    COALESCE(SUM(spent_budget), 0) 
  INTO v_total_budget, v_total_spent 
  FROM projects 
  WHERE facility_id = p_facility_id
    AND (is_deleted IS NULL OR is_deleted = false);
  
  -- Previous month projects
  SELECT COUNT(*) INTO v_prev_total_projects
  FROM projects
  WHERE facility_id = p_facility_id
    AND created_at <= v_prev_end_date
    AND (is_deleted IS NULL OR is_deleted = false);
  
  IF v_prev_total_projects > 0 THEN
    v_project_change := ((v_total_projects::DECIMAL - v_prev_total_projects::DECIMAL) / v_prev_total_projects::DECIMAL) * 100;
  ELSIF v_total_projects > 0 THEN
    v_project_change := 100;
  END IF;
  
  -- 4. Qurban Calculations
  SELECT 
    COALESCE(SUM(share_count), 0),
    COALESCE(SUM(amount_in_try), 0),
    COUNT(DISTINCT donor_name)
  INTO v_total_shares, v_total_donations, v_total_donors
  FROM qurban_donations
  WHERE facility_id = p_facility_id 
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
    AND payment_status = 'paid';
  
  SELECT COALESCE(SUM(completed_animals), 0) INTO v_slaughtered_count 
  FROM qurban_campaigns 
  WHERE facility_id = p_facility_id;
  
  SELECT COALESCE(SUM(package_count), 0) INTO v_distributed_count 
  FROM distribution_records 
  WHERE facility_id = p_facility_id;
  
  -- Previous period qurban
  SELECT 
    COALESCE(SUM(share_count), 0),
    COALESCE(SUM(amount_in_try), 0)
  INTO v_prev_total_shares, v_prev_total_donations
  FROM qurban_donations
  WHERE facility_id = p_facility_id
    AND created_at >= v_prev_start_date
    AND created_at <= v_prev_end_date
    AND payment_status = 'paid';
  
  IF v_prev_total_shares > 0 THEN
    v_share_change := ((v_total_shares::DECIMAL - v_prev_total_shares::DECIMAL) / v_prev_total_shares::DECIMAL) * 100;
  ELSIF v_total_shares > 0 THEN
    v_share_change := 100;
  END IF;
  
  IF v_prev_total_donations > 0 THEN
    v_donation_change := ((v_total_donations - v_prev_total_donations) / v_prev_total_donations) * 100;
  ELSIF v_total_donations > 0 THEN
    v_donation_change := 100;
  END IF;

  -- Construct Result
  RETURN jsonb_build_object(
    'finance', jsonb_build_object(
      'totalIncome', v_total_income,
      'totalExpense', v_total_expense,
      'netIncome', v_net_income,
      'incomeChange', v_income_change,
      'expenseChange', v_expense_change,
      'pendingTransactions', v_pending_transactions,
      'monthlyTrend', COALESCE(v_monthly_trend, '[]'::jsonb),
      'categoryExpenses', COALESCE(v_category_expenses, '[]'::jsonb),
      'categoryIncomes', COALESCE(v_category_incomes, '[]'::jsonb)
    ),
    'hr', jsonb_build_object(
      'totalEmployees', v_total_employees,
      'activeEmployees', v_active_employees,
      'leaveCount', v_leave_count,
      'totalSalaries', v_monthly_payroll,
      'employeeChange', v_employee_change
    ),
    'projects', jsonb_build_object(
      'totalProjects', v_total_projects,
      'activeProjects', v_active_projects,
      'completedProjects', v_completed_projects,
      'totalBudget', v_total_budget,
      'totalSpent', v_total_spent,
      'projectChange', v_project_change
    ),
    'qurban', jsonb_build_object(
      'totalShares', v_total_shares,
      'totalDonations', v_total_donations,
      'slaughteredCount', v_slaughtered_count,
      'distributedCount', v_distributed_count,
      'shareChange', v_share_change,
      'donationChange', v_donation_change
    )
  );
END;
$$;

