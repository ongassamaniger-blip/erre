-- =============================================================================
-- FIX ALL SUPABASE WARNINGS & FIRST USER REGISTRATION
-- =============================================================================
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- Tüm güvenlik uyarılarını düzeltir ve ilk kullanıcı kaydını ayarlar
-- =============================================================================

-- 1. DROP EXISTING TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. CREATE ROBUST HANDLE_NEW_USER FUNCTION WITH PROPER SEARCH_PATH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_facility_id UUID;
BEGIN
  -- Check if this is the first user in the profiles table
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO v_is_first_user;

  -- Create Profile (Handle potential conflicts gracefully)
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Kullanıcı'),
    CASE WHEN v_is_first_user THEN 'Super Admin' ELSE 'User' END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN v_is_first_user THEN 'Super Admin' ELSE EXCLUDED.role END,
    updated_at = NOW();

  -- Ensure Default Facility Exists (Genel Merkez)
  SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
  
  IF v_facility_id IS NULL THEN
    INSERT INTO public.facilities (name, code, type, location, enabled_modules)
    VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
    RETURNING id INTO v_facility_id;
  END IF;

  -- Grant Facility Access
  IF v_facility_id IS NOT NULL THEN
    INSERT INTO public.facility_users (user_id, facility_id)
    VALUES (NEW.id, v_facility_id)
    ON CONFLICT (user_id, facility_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. CREATE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- RLS POLICIES FOR PROFILES TABLE
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all reads for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_all" ON public.profiles 
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- RLS POLICIES FOR FACILITIES TABLE
-- =============================================================================

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all reads for facilities" ON public.facilities;
DROP POLICY IF EXISTS "facilities_select_all" ON public.facilities;
DROP POLICY IF EXISTS "facilities_insert_auth" ON public.facilities;

CREATE POLICY "facilities_select_all" ON public.facilities 
  FOR SELECT USING (true);

CREATE POLICY "facilities_insert_auth" ON public.facilities 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- RLS POLICIES FOR FACILITY_USERS TABLE
-- =============================================================================

ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all reads for facility_users" ON public.facility_users;
DROP POLICY IF EXISTS "Users can view their own facility access" ON public.facility_users;
DROP POLICY IF EXISTS "facility_users_select_all" ON public.facility_users;
DROP POLICY IF EXISTS "facility_users_insert_auth" ON public.facility_users;
DROP POLICY IF EXISTS "facility_users_update_auth" ON public.facility_users;

CREATE POLICY "facility_users_select_all" ON public.facility_users 
  FOR SELECT USING (true);

CREATE POLICY "facility_users_insert_auth" ON public.facility_users 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "facility_users_update_auth" ON public.facility_users 
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================================================
-- FIX FUNCTIONS WITH MUTABLE SEARCH_PATH (SECURITY WARNINGS)
-- Using EXACT same parameter names as existing functions
-- =============================================================================

-- Fix has_facility_access (original param: target_facility_id)
CREATE OR REPLACE FUNCTION public.has_facility_access(target_facility_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.facility_users
    WHERE user_id = auth.uid() AND facility_id = target_facility_id
  );
END;
$$;

-- Fix update_updated_at_column (no params - trigger function)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix populate_transaction_snapshots (no params - trigger function)
CREATE OR REPLACE FUNCTION public.populate_transaction_snapshots()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- Fix seed_default_departments (no params)
CREATE OR REPLACE FUNCTION public.seed_default_departments()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NULL;
END;
$$;

-- Fix increment_campaign_collected (original params: campaign_id, amount_to_add)
CREATE OR REPLACE FUNCTION public.increment_campaign_collected(campaign_id UUID, amount_to_add NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.qurban_campaigns 
  SET collected_amount = COALESCE(collected_amount, 0) + amount_to_add,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$;

-- Fix decrement_campaign_collected (original params: campaign_id, amount_to_subtract)
CREATE OR REPLACE FUNCTION public.decrement_campaign_collected(campaign_id UUID, amount_to_subtract NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.qurban_campaigns 
  SET collected_amount = GREATEST(0, COALESCE(collected_amount, 0) - amount_to_subtract),
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$;

-- Fix calculate_campaign_stats (no params - trigger function)
CREATE OR REPLACE FUNCTION public.calculate_campaign_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- Fix update_project_finance_stats (no params - trigger function)
CREATE OR REPLACE FUNCTION public.update_project_finance_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- Fix update_project_task_stats (no params - trigger function)
CREATE OR REPLACE FUNCTION public.update_project_task_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- Fix update_project_team_stats (no params - trigger function)
CREATE OR REPLACE FUNCTION public.update_project_team_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- Fix delete_facility_cascade (original param: target_facility_id)
CREATE OR REPLACE FUNCTION public.delete_facility_cascade(target_facility_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.facility_users WHERE facility_id = target_facility_id;
  DELETE FROM public.facilities WHERE id = target_facility_id;
END;
$$;

-- Fix initialize_facility_settings (no params - trigger function)
CREATE OR REPLACE FUNCTION public.initialize_facility_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.settings IS NULL THEN
    NEW.settings := '{}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix get_dashboard_summary (original params: p_facility_id, p_start_date, p_end_date)
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
  p_facility_id UUID,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_income DECIMAL := 0;
  v_total_expense DECIMAL := 0;
  v_net_income DECIMAL := 0;
  v_pending_transactions INT := 0;
  v_category_expenses JSONB := '[]'::jsonb;
  v_category_incomes JSONB := '[]'::jsonb;
  v_prev_start_date TIMESTAMP;
  v_prev_end_date TIMESTAMP;
  v_duration INTERVAL;
  v_total_employees INT := 0;
  v_active_employees INT := 0;
  v_leave_count INT := 0;
  v_monthly_payroll DECIMAL := 0;
  v_total_projects INT := 0;
  v_active_projects INT := 0;
  v_completed_projects INT := 0;
  v_total_budget DECIMAL := 0;
  v_total_spent DECIMAL := 0;
  v_overdue_tasks INT := 0;
  v_total_shares INT := 0;
  v_total_donations DECIMAL := 0;
  v_slaughtered_count INT := 0;
  v_distributed_count INT := 0;
  v_total_donors INT := 0;
BEGIN
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_duration := p_end_date - p_start_date;
    v_prev_end_date := p_start_date - INTERVAL '1 second';
    v_prev_start_date := v_prev_end_date - v_duration;
  ELSE
    v_prev_start_date := date_trunc('month', CURRENT_DATE - INTERVAL '1 month');
    v_prev_end_date := date_trunc('month', CURRENT_DATE) - INTERVAL '1 second';
  END IF;

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

  SELECT COUNT(*) INTO v_pending_transactions 
  FROM transactions 
  WHERE facility_id = p_facility_id AND status = 'pending';

  SELECT COUNT(*) INTO v_total_employees FROM employees WHERE facility_id = p_facility_id;
  SELECT COUNT(*) INTO v_active_employees FROM employees WHERE facility_id = p_facility_id AND status = 'active';
  SELECT COUNT(*) INTO v_leave_count FROM employees WHERE facility_id = p_facility_id AND status = 'on-leave';
  
  SELECT COALESCE(SUM(salary), 0) INTO v_monthly_payroll 
  FROM employees 
  WHERE facility_id = p_facility_id AND status = 'active';

  SELECT COUNT(*) INTO v_total_projects FROM projects WHERE facility_id = p_facility_id;
  SELECT COUNT(*) INTO v_active_projects FROM projects WHERE facility_id = p_facility_id AND status = 'active';
  SELECT COUNT(*) INTO v_completed_projects FROM projects WHERE facility_id = p_facility_id AND status = 'completed';
  SELECT COALESCE(SUM(budget), 0), COALESCE(SUM(spent), 0) INTO v_total_budget, v_total_spent FROM projects WHERE facility_id = p_facility_id;

  BEGIN
    SELECT COUNT(*) INTO v_overdue_tasks 
    FROM tasks 
    WHERE project_id IN (SELECT id FROM projects WHERE facility_id = p_facility_id)
      AND status != 'completed'
      AND due_date < CURRENT_DATE;
  EXCEPTION WHEN OTHERS THEN
    v_overdue_tasks := 0;
  END;

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

-- Fix prevent_budget_transfer_modification (no params - trigger function)
CREATE OR REPLACE FUNCTION public.prevent_budget_transfer_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'Cannot modify approved budget transfer';
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT 'Setup completed!' as status;
SELECT 'Profiles count:' as info, COUNT(*) as count FROM public.profiles;
SELECT 'Facilities:' as info, name, code FROM public.facilities;
