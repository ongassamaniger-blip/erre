-- ============================================
-- NGO Management System - Complete Supabase Schema
-- Version: 1.0 (December 2024)
-- ============================================
-- This file contains ALL SQL needed to set up the database from scratch
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SECTION 1: CORE TABLES
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Manager', 'User')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facilities (Headquarters + Branches)
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('headquarters', 'branch')),
  parent_facility_id UUID REFERENCES public.facilities(id),
  enabled_modules TEXT[] DEFAULT ARRAY['finance', 'hr', 'projects', 'qurban'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Facility Access
CREATE TABLE IF NOT EXISTS public.facility_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, facility_id)
);

-- ============================================
-- SECTION 2: HR MODULE
-- ============================================

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  manager_id UUID REFERENCES public.profiles(id),
  manager_name TEXT,
  employee_count INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, facility_id)
);

-- Employees
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  national_id TEXT,
  date_of_birth DATE,
  nationality TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  phone TEXT,
  email TEXT UNIQUE,
  address TEXT,
  emergency_contact JSONB,
  department_id UUID REFERENCES public.departments(id),
  department TEXT,
  position TEXT NOT NULL,
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'on-leave')),
  hire_date DATE NOT NULL,
  contract_start_date DATE,
  contract_end_date DATE,
  termination_date DATE,
  working_hours TEXT,
  salary JSONB,
  leave_entitlements JSONB,
  documents JSONB,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  employee_name TEXT NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'maternity', 'paternity', 'compassionate')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approver_id UUID REFERENCES public.profiles(id),
  approver_name TEXT,
  approval_date TIMESTAMPTZ,
  approval_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'half-day', 'on-leave')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Payrolls Table
CREATE TABLE IF NOT EXISTS public.payrolls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  allowances JSONB DEFAULT '[]'::jsonb,
  deductions JSONB DEFAULT '[]'::jsonb,
  bonuses JSONB DEFAULT '[]'::jsonb,
  gross_salary NUMERIC NOT NULL DEFAULT 0,
  total_deductions NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid', 'cancelled')),
  payment_date DATE,
  notes TEXT,
  signed_by_employee BOOLEAN DEFAULT FALSE,
  signed_date TIMESTAMPTZ,
  signed_by TEXT,
  facility_id UUID REFERENCES public.facilities(id),
  iban TEXT,
  bank_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECTION 3: PROJECTS MODULE
-- ============================================

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
  type TEXT,
  category TEXT,
  manager_id UUID REFERENCES public.employees(id),
  manager_name TEXT,
  manager_avatar TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget DECIMAL(15,2),
  spent DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  team_size INTEGER DEFAULT 0,
  task_count INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  overdue_tasks INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Tasks
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee_id UUID REFERENCES public.employees(id),
  assignee_name TEXT,
  assignee_avatar TEXT,
  start_date DATE,
  due_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Milestones
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'delayed')),
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Team Members
CREATE TABLE IF NOT EXISTS public.project_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  employee_name TEXT NOT NULL,
  employee_avatar TEXT,
  role TEXT NOT NULL,
  allocation INTEGER DEFAULT 100 CHECK (allocation >= 0 AND allocation <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, employee_id)
);

-- Project Documents
CREATE TABLE IF NOT EXISTS public.project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  size INTEGER,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.profiles(id),
  category TEXT CHECK (category IN ('contracts', 'reports', 'other')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Activities
CREATE TABLE IF NOT EXISTS public.project_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task_created', 'task_completed', 'status_changed', 'member_added', 'comment_added')),
  description TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECTION 4: FINANCE MODULE
-- ============================================

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  parent_id UUID REFERENCES public.categories(id),
  color TEXT,
  facility_id UUID REFERENCES public.facilities(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors & Customers
CREATE TABLE IF NOT EXISTS public.vendors_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vendor', 'customer')),
  tax_number TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  contact_person TEXT,
  facility_id UUID REFERENCES public.facilities(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id UUID REFERENCES public.chart_of_accounts(id),
  level INTEGER NOT NULL,
  facility_id UUID REFERENCES public.facilities(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, facility_id)
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  transaction_number TEXT UNIQUE NOT NULL,
  title TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT,
  category_id UUID REFERENCES public.categories(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  exchange_rate DECIMAL(10,4) DEFAULT 1,
  amount_in_base_currency DECIMAL(15,2),
  description TEXT NOT NULL,
  vendor_customer_id UUID REFERENCES public.vendors_customers(id),
  department_id UUID REFERENCES public.departments(id),
  project_id UUID REFERENCES public.projects(id),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'other')),
  documents JSONB DEFAULT '[]'::jsonb,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'completed')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('annual', 'quarterly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2),
  spent_amount DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  category_id UUID REFERENCES public.categories(id),
  department_id UUID REFERENCES public.departments(id),
  project_id UUID REFERENCES public.projects(id),
  scope TEXT DEFAULT 'general' CHECK (scope IN ('general', 'category', 'department', 'project')),
  scope_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'approved')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Transfers (Headquarters to Branches)
CREATE TABLE IF NOT EXISTS public.budget_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  to_facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  transfer_date DATE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled', 'rejected')),
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECTION 5: QURBAN MODULE
-- ============================================

-- Qurban Campaigns
CREATE TABLE IF NOT EXISTS public.qurban_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'archived', 'pending_approval', 'rejected')),
  campaign_type TEXT CHECK (campaign_type IN ('small_cattle', 'large_cattle')),
  target_amount DECIMAL(15,2) NOT NULL,
  collected_amount DECIMAL(15,2) DEFAULT 0,
  target_animals INTEGER NOT NULL,
  completed_animals INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  slaughter_start_date DATE,
  slaughter_end_date DATE,
  description TEXT,
  currency TEXT DEFAULT 'TRY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Qurban Donations
CREATE TABLE IF NOT EXISTS public.qurban_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id),
  campaign_id UUID REFERENCES public.qurban_campaigns(id) NOT NULL,
  campaign_name TEXT NOT NULL,
  donor_name TEXT NOT NULL,
  donor_phone TEXT,
  donor_email TEXT,
  donor_country TEXT,
  qurban_type TEXT NOT NULL CHECK (qurban_type IN ('sheep', 'goat', 'cow-share', 'camel-share')),
  share_count INTEGER DEFAULT 1,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  exchange_rate DECIMAL(10,4) DEFAULT 1,
  amount_in_try DECIMAL(15,2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  distribution_region TEXT,
  delivery_address TEXT,
  has_proxy BOOLEAN DEFAULT FALSE,
  proxy_text TEXT,
  special_requests TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'completed')),
  created_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Qurban Schedules
CREATE TABLE IF NOT EXISTS public.qurban_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  planned_count INTEGER NOT NULL,
  completed_count INTEGER DEFAULT 0,
  campaign_ids UUID[],
  team_members UUID[],
  responsible TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Distribution Records
CREATE TABLE IF NOT EXISTS public.distribution_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id),
  campaign_id UUID REFERENCES public.qurban_campaigns(id) NOT NULL,
  campaign_name TEXT NOT NULL,
  date DATE NOT NULL,
  distribution_type TEXT NOT NULL CHECK (distribution_type IN ('bulk', 'individual')),
  region TEXT NOT NULL,
  package_count INTEGER,
  total_weight DECIMAL(10,2),
  average_weight_per_package DECIMAL(10,2),
  distribution_list TEXT,
  package_number TEXT,
  recipient_name TEXT,
  recipient_code TEXT,
  weight DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
  received_by TEXT,
  signature TEXT,
  photo TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECTION 6: SYSTEM TABLES
-- ============================================

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Requests
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id),
  module TEXT NOT NULL CHECK (module IN ('finance', 'hr', 'projects', 'qurban')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15,2),
  currency TEXT DEFAULT 'TRY',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  requester_id UUID REFERENCES public.profiles(id),
  requester_name TEXT,
  approver_id UUID REFERENCES public.profiles(id),
  approver_name TEXT,
  deadline DATE,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Steps
CREATE TABLE IF NOT EXISTS public.approval_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_request_id UUID REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  approver_id UUID REFERENCES public.profiles(id),
  approver_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(facility_id, category, key)
);

-- ============================================
-- SECTION 7: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check facility access
CREATE OR REPLACE FUNCTION has_facility_access(target_facility_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.facility_users
    WHERE user_id = auth.uid() AND facility_id = target_facility_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 8: RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow profile creation on signup" ON public.profiles FOR INSERT WITH CHECK (true);

-- Facilities
CREATE POLICY "Users can view accessible facilities" ON public.facilities
  FOR SELECT USING (id IN (SELECT facility_id FROM public.facility_users WHERE user_id = auth.uid()));
CREATE POLICY "Allow facility insert" ON public.facilities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow facility update" ON public.facilities FOR UPDATE USING (true);

-- Facility Users
CREATE POLICY "Users can view own facility access" ON public.facility_users FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow facility_users insert" ON public.facility_users FOR INSERT WITH CHECK (true);

-- Transactions
CREATE POLICY "Users can view own facility transactions" ON public.transactions FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update own facility transactions" ON public.transactions FOR UPDATE USING (has_facility_access(facility_id));
CREATE POLICY "Users can delete own facility transactions" ON public.transactions FOR DELETE USING (has_facility_access(facility_id));

-- Budgets
CREATE POLICY "Users can view own facility budgets" ON public.budgets FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create budgets" ON public.budgets FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update budgets" ON public.budgets FOR UPDATE USING (has_facility_access(facility_id));
CREATE POLICY "Users can delete budgets" ON public.budgets FOR DELETE USING (has_facility_access(facility_id));

-- Budget Transfers
CREATE POLICY "Users can view budget transfers" ON public.budget_transfers FOR SELECT USING (has_facility_access(from_facility_id) OR has_facility_access(to_facility_id));
CREATE POLICY "Users can create budget transfers" ON public.budget_transfers FOR INSERT WITH CHECK (has_facility_access(from_facility_id));
CREATE POLICY "Users can update budget transfers" ON public.budget_transfers FOR UPDATE USING (has_facility_access(from_facility_id) OR has_facility_access(to_facility_id));

-- Employees
CREATE POLICY "Users can view own facility employees" ON public.employees FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create employees" ON public.employees FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update employees" ON public.employees FOR UPDATE USING (has_facility_access(facility_id));
CREATE POLICY "Users can delete employees" ON public.employees FOR DELETE USING (has_facility_access(facility_id));

-- Departments
CREATE POLICY "Users can view departments" ON public.departments FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create departments" ON public.departments FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update departments" ON public.departments FOR UPDATE USING (has_facility_access(facility_id));
CREATE POLICY "Users can delete departments" ON public.departments FOR DELETE USING (has_facility_access(facility_id));

-- Leave Requests
CREATE POLICY "Users can view own facility leave requests" ON public.leave_requests FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create leave requests" ON public.leave_requests FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update leave requests" ON public.leave_requests FOR UPDATE USING (has_facility_access(facility_id));

-- Attendance
CREATE POLICY "Users can view attendance" ON public.attendance_records FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create attendance" ON public.attendance_records FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update attendance" ON public.attendance_records FOR UPDATE USING (has_facility_access(facility_id));

-- Payrolls
CREATE POLICY "Enable read access for authenticated users" ON public.payrolls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.payrolls FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON public.payrolls FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON public.payrolls FOR DELETE TO authenticated USING (true);

-- Projects
CREATE POLICY "Users can view own facility projects" ON public.projects FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update projects" ON public.projects FOR UPDATE USING (has_facility_access(facility_id));
CREATE POLICY "Users can delete projects" ON public.projects FOR DELETE USING (has_facility_access(facility_id));

-- Project Tasks
CREATE POLICY "Users can view tasks" ON public.project_tasks FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_tasks.project_id AND has_facility_access(projects.facility_id)));
CREATE POLICY "Users can manage tasks" ON public.project_tasks FOR ALL USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_tasks.project_id AND has_facility_access(projects.facility_id)));

-- Project Milestones
CREATE POLICY "Users can view milestones" ON public.project_milestones FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_milestones.project_id AND has_facility_access(projects.facility_id)));
CREATE POLICY "Users can manage milestones" ON public.project_milestones FOR ALL USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_milestones.project_id AND has_facility_access(projects.facility_id)));

-- Project Team Members
CREATE POLICY "Users can view team members" ON public.project_team_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_team_members.project_id AND has_facility_access(projects.facility_id)));
CREATE POLICY "Users can manage team members" ON public.project_team_members FOR ALL USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_team_members.project_id AND has_facility_access(projects.facility_id)));

-- Project Documents
CREATE POLICY "Users can view documents" ON public.project_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_documents.project_id AND has_facility_access(projects.facility_id)));
CREATE POLICY "Users can manage documents" ON public.project_documents FOR ALL USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_documents.project_id AND has_facility_access(projects.facility_id)));

-- Project Activities
CREATE POLICY "Users can view activities" ON public.project_activities FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_activities.project_id AND has_facility_access(projects.facility_id)));
CREATE POLICY "Users can create activities" ON public.project_activities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_activities.project_id AND has_facility_access(projects.facility_id)));

-- Qurban Campaigns
CREATE POLICY "Users can view own facility campaigns" ON public.qurban_campaigns FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can create campaigns" ON public.qurban_campaigns FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can update campaigns" ON public.qurban_campaigns FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can delete campaigns" ON public.qurban_campaigns FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Qurban Donations
CREATE POLICY "Users can view donations" ON public.qurban_donations FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can create donations" ON public.qurban_donations FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can update donations" ON public.qurban_donations FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can delete donations" ON public.qurban_donations FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Qurban Schedules
CREATE POLICY "Users can view schedules" ON public.qurban_schedules FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can create schedules" ON public.qurban_schedules FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can update schedules" ON public.qurban_schedules FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can delete schedules" ON public.qurban_schedules FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Distribution Records
CREATE POLICY "Users can view distributions" ON public.distribution_records FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can create distributions" ON public.distribution_records FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can update distributions" ON public.distribution_records FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Allow notification creation" ON public.notifications FOR INSERT WITH CHECK (true);

-- Categories
CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can create categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update categories" ON public.categories FOR UPDATE USING (true);

-- Vendors Customers
CREATE POLICY "Users can view vendors_customers" ON public.vendors_customers FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can create vendors_customers" ON public.vendors_customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update vendors_customers" ON public.vendors_customers FOR UPDATE USING (true);

-- Approval Requests
CREATE POLICY "Users can view approval requests" ON public.approval_requests FOR SELECT USING (has_facility_access(facility_id) OR requester_id = auth.uid() OR approver_id = auth.uid());
CREATE POLICY "Users can create approval requests" ON public.approval_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update approval requests" ON public.approval_requests FOR UPDATE USING (true);

-- Approval Steps
CREATE POLICY "Users can view approval steps" ON public.approval_steps FOR SELECT USING (true);
CREATE POLICY "Users can manage approval steps" ON public.approval_steps FOR ALL USING (true);

-- Settings
CREATE POLICY "Users can view settings" ON public.settings FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can manage settings" ON public.settings FOR ALL USING (true);

-- Activity Logs
CREATE POLICY "Users can view activity logs" ON public.activity_logs FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create activity logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- Chart of Accounts
CREATE POLICY "Users can view chart of accounts" ON public.chart_of_accounts FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can manage chart of accounts" ON public.chart_of_accounts FOR ALL USING (true);

-- ============================================
-- SECTION 9: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_transactions_facility_id ON public.transactions(facility_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_facility_id ON public.budgets(facility_id);
CREATE INDEX IF NOT EXISTS idx_employees_facility_id ON public.employees(facility_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_projects_facility_id ON public.projects(facility_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_qurban_donations_campaign_id ON public.qurban_donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_qurban_donations_payment_status ON public.qurban_donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_users_user_id ON public.facility_users(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_users_facility_id ON public.facility_users(facility_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_employee_id ON public.payrolls(employee_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_period ON public.payrolls(period);

-- ============================================
-- SECTION 10: FUNCTIONS & TRIGGERS
-- ============================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payrolls_updated_at BEFORE UPDATE ON public.payrolls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SECTION 11: AUTH TRIGGER (First User = Super Admin)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_facility_id UUID;
BEGIN
  -- Check if this is the first user in the profiles table
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO v_is_first_user;

  -- Create Profile
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Kullanıcı'),
    CASE WHEN v_is_first_user THEN 'Super Admin' ELSE 'User' END,
    NOW(),
    NOW()
  );

  -- Ensure Default Facility Exists
  SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
  IF v_facility_id IS NULL THEN
    INSERT INTO public.facilities (name, code, type, location, enabled_modules)
    VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
    RETURNING id INTO v_facility_id;
  END IF;

  -- Grant Facility Access
  INSERT INTO public.facility_users (user_id, facility_id)
  VALUES (NEW.id, v_facility_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SECTION 12: QURBAN CAMPAIGN STATS TRIGGER
-- ============================================

-- Function to calculate campaign stats (7 shares = 1 animal for large_cattle)
CREATE OR REPLACE FUNCTION calculate_campaign_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_campaign_id UUID;
    total_amount DECIMAL(15, 2);
    total_shares INTEGER;
    camp_type TEXT;
    animal_count INTEGER;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_campaign_id := OLD.campaign_id;
    ELSE
        target_campaign_id := NEW.campaign_id;
    END IF;

    -- Get campaign type
    SELECT campaign_type INTO camp_type FROM qurban_campaigns WHERE id = target_campaign_id;

    -- Calculate total collected amount (only paid donations)
    SELECT COALESCE(SUM(COALESCE(amount_in_try, amount)), 0)
    INTO total_amount
    FROM qurban_donations
    WHERE campaign_id = target_campaign_id AND payment_status = 'paid';

    -- Calculate total animals based on campaign type
    IF camp_type = 'small_cattle' THEN
        SELECT COALESCE(SUM(share_count), 0)
        INTO animal_count
        FROM qurban_donations
        WHERE campaign_id = target_campaign_id AND payment_status = 'paid';
    ELSIF camp_type = 'large_cattle' THEN
        SELECT COALESCE(SUM(share_count), 0)
        INTO total_shares
        FROM qurban_donations
        WHERE campaign_id = target_campaign_id AND payment_status = 'paid';
        
        animal_count := FLOOR(total_shares / 7);
    ELSE
        animal_count := 0;
    END IF;

    -- Update the campaign
    UPDATE qurban_campaigns
    SET 
        collected_amount = total_amount,
        completed_animals = animal_count,
        status = CASE 
            WHEN total_amount >= target_amount THEN 'completed'
            WHEN status = 'completed' AND total_amount < target_amount THEN 'active'
            ELSE status
        END
    WHERE id = target_campaign_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON qurban_donations;
CREATE TRIGGER update_campaign_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON qurban_donations
FOR EACH ROW
EXECUTE FUNCTION calculate_campaign_stats();

-- ============================================
-- SECTION 13: DASHBOARD SUMMARY RPC
-- ============================================

CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_facility_id UUID,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_income DECIMAL := 0;
  v_total_expense DECIMAL := 0;
  v_net_income DECIMAL := 0;
  v_total_employees INT := 0;
  v_active_employees INT := 0;
  v_leave_count INT := 0;
  v_total_projects INT := 0;
  v_active_projects INT := 0;
  v_completed_projects INT := 0;
  v_total_budget DECIMAL := 0;
  v_total_spent DECIMAL := 0;
  v_total_shares INT := 0;
  v_total_donations DECIMAL := 0;
  v_slaughtered_count INT := 0;
  v_distributed_count INT := 0;
BEGIN
  -- Finance Calculations
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN COALESCE(amount_in_base_currency, amount) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN COALESCE(amount_in_base_currency, amount) ELSE 0 END), 0)
  INTO v_total_income, v_total_expense
  FROM transactions
  WHERE facility_id = p_facility_id AND status = 'approved';
  
  v_net_income := v_total_income - v_total_expense;
  
  -- HR Calculations
  SELECT COUNT(*) INTO v_total_employees FROM employees WHERE facility_id = p_facility_id;
  SELECT COUNT(*) INTO v_active_employees FROM employees WHERE facility_id = p_facility_id AND status = 'active';
  SELECT COUNT(*) INTO v_leave_count FROM employees WHERE facility_id = p_facility_id AND status = 'on-leave';
  
  -- Projects Calculations
  SELECT COUNT(*) INTO v_total_projects FROM projects WHERE facility_id = p_facility_id AND (is_deleted IS NULL OR is_deleted = false);
  SELECT COUNT(*) INTO v_active_projects FROM projects WHERE facility_id = p_facility_id AND status = 'active' AND (is_deleted IS NULL OR is_deleted = false);
  SELECT COUNT(*) INTO v_completed_projects FROM projects WHERE facility_id = p_facility_id AND status = 'completed' AND (is_deleted IS NULL OR is_deleted = false);
  SELECT COALESCE(SUM(budget), 0), COALESCE(SUM(spent), 0) INTO v_total_budget, v_total_spent FROM projects WHERE facility_id = p_facility_id AND (is_deleted IS NULL OR is_deleted = false);
  
  -- Qurban Calculations
  SELECT 
    COALESCE(SUM(share_count), 0),
    COALESCE(SUM(COALESCE(amount_in_try, amount)), 0)
  INTO v_total_shares, v_total_donations
  FROM qurban_donations
  WHERE facility_id = p_facility_id AND payment_status = 'paid';
  
  SELECT COALESCE(SUM(completed_animals), 0) INTO v_slaughtered_count FROM qurban_campaigns WHERE facility_id = p_facility_id;
  SELECT COALESCE(SUM(package_count), 0) INTO v_distributed_count FROM distribution_records WHERE facility_id = p_facility_id;

  RETURN jsonb_build_object(
    'finance', jsonb_build_object(
      'totalIncome', v_total_income,
      'totalExpense', v_total_expense,
      'netIncome', v_net_income
    ),
    'hr', jsonb_build_object(
      'totalEmployees', v_total_employees,
      'activeEmployees', v_active_employees,
      'leaveCount', v_leave_count
    ),
    'projects', jsonb_build_object(
      'totalProjects', v_total_projects,
      'activeProjects', v_active_projects,
      'completedProjects', v_completed_projects,
      'totalBudget', v_total_budget,
      'totalSpent', v_total_spent
    ),
    'qurban', jsonb_build_object(
      'totalShares', v_total_shares,
      'totalDonations', v_total_donations,
      'slaughteredCount', v_slaughtered_count,
      'distributedCount', v_distributed_count
    )
  );
END;
$$;

-- ============================================
-- SECTION 14: STORAGE BUCKETS
-- Run these in Supabase Dashboard -> Storage
-- ============================================

-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('distribution-photos', 'distribution-photos', false);

-- Storage policies (run after creating buckets)
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Authenticated users can view" ON storage.objects FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE TO authenticated USING (true);

-- ============================================
-- SECTION 15: DEFAULT DATA
-- ============================================

-- Default Categories (run after creating a facility)
-- INSERT INTO public.categories (name, type, facility_id) VALUES
--   ('Bağışlar', 'income', NULL),
--   ('Kurban Bağışları', 'income', NULL),
--   ('Genel Merkez Bütçe Aktarımı', 'income', NULL),
--   ('Personel Giderleri', 'expense', NULL),
--   ('Kira', 'expense', NULL),
--   ('Faturalar', 'expense', NULL),
--   ('Diğer Gelirler', 'income', NULL),
--   ('Diğer Giderler', 'expense', NULL);

-- ============================================
-- END OF SCHEMA
-- ============================================
