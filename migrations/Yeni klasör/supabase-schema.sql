-- ============================================
-- NGO Management System - Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Manager', 'User')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facilities (Headquarters + Branches)
CREATE TABLE public.facilities (
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
CREATE TABLE public.facility_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, facility_id)
);

-- ============================================
-- HR MODULE (Created first - referenced by other tables)
-- ============================================

-- Departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  manager_id UUID REFERENCES public.profiles(id),
  manager_name TEXT,
  employee_count INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, facility_id)
);

-- Employees
CREATE TABLE public.employees (
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
CREATE TABLE public.leave_requests (
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
CREATE TABLE public.attendance_records (
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

-- Payroll Records
CREATE TABLE public.payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  basic_salary DECIMAL(15,2) NOT NULL,
  allowances JSONB,
  deductions JSONB,
  net_salary DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  payment_date DATE,
  payment_method TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECTS MODULE (Created second - referenced by Finance)
-- ============================================

-- Projects
CREATE TABLE public.projects (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FINANCE MODULE (Now can reference departments and projects)
-- ============================================

-- Categories
CREATE TABLE public.categories (
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
CREATE TABLE public.vendors_customers (
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
CREATE TABLE public.chart_of_accounts (
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

-- Transactions (Now departments and projects exist)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  transaction_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES public.categories(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  description TEXT NOT NULL,
  vendor_customer_id UUID REFERENCES public.vendors_customers(id),
  department_id UUID REFERENCES public.departments(id),
  project_id UUID REFERENCES public.projects(id),
  payment_method TEXT,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'completed')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('annual', 'quarterly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  spent_amount DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  category_id UUID REFERENCES public.categories(id),
  department_id UUID REFERENCES public.departments(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Transfers (Headquarters to Branches)
CREATE TABLE public.budget_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  to_facility_id UUID REFERENCES public.facilities(id) NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  transfer_date DATE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
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

-- Milestones
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in-progress', 'completed', 'delayed')),
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Team Members
CREATE TABLE public.project_team_members (
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
CREATE TABLE public.project_documents (
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
CREATE TABLE public.project_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task_created', 'task_completed', 'status_changed', 'member_added', 'comment_added')),
  description TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QURBAN MODULE
-- ============================================

-- Qurban Campaigns
CREATE TABLE public.qurban_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID REFERENCES public.facilities(id),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'archived')),
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
CREATE TABLE public.qurban_donations (
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
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  distribution_region TEXT,
  has_proxy BOOLEAN DEFAULT FALSE,
  proxy_text TEXT,
  special_requests TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'completed')),
  created_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Qurban Schedules
CREATE TABLE public.qurban_schedules (
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
CREATE TABLE public.distribution_records (
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
-- SYSTEM TABLES
-- ============================================

-- Notifications
CREATE TABLE public.notifications (
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
CREATE TABLE public.approval_requests (
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
CREATE TABLE public.approval_steps (
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
CREATE TABLE public.activity_logs (
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

-- Form Templates
CREATE TABLE public.form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  fields JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE public.settings (
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
-- ROW LEVEL SECURITY POLICIES
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
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Facilities: Users can only see facilities they have access to
CREATE POLICY "Users can view accessible facilities" ON public.facilities
  FOR SELECT USING (
    id IN (
      SELECT facility_id FROM public.facility_users WHERE user_id = auth.uid()
    )
  );

-- Facility Users: Users can see their own access
CREATE POLICY "Users can view own facility access" ON public.facility_users
  FOR SELECT USING (user_id = auth.uid());

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

-- Transactions: Users can only see transactions from their facilities
CREATE POLICY "Users can view own facility transactions" ON public.transactions
  FOR SELECT USING (has_facility_access(facility_id));

CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (has_facility_access(facility_id));

CREATE POLICY "Users can update own facility transactions" ON public.transactions
  FOR UPDATE USING (has_facility_access(facility_id));

CREATE POLICY "Users can delete own facility transactions" ON public.transactions
  FOR DELETE USING (has_facility_access(facility_id));

-- Apply similar policies to all facility-scoped tables
-- Budgets
CREATE POLICY "Users can view own facility budgets" ON public.budgets
  FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create budgets" ON public.budgets
  FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update budgets" ON public.budgets
  FOR UPDATE USING (has_facility_access(facility_id));
CREATE POLICY "Users can delete budgets" ON public.budgets
  FOR DELETE USING (has_facility_access(facility_id));

-- Employees
CREATE POLICY "Users can view own facility employees" ON public.employees
  FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create employees" ON public.employees
  FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update employees" ON public.employees
  FOR UPDATE USING (has_facility_access(facility_id));
CREATE POLICY "Users can delete employees" ON public.employees
  FOR DELETE USING (has_facility_access(facility_id));

-- Leave Requests
CREATE POLICY "Users can view own facility leave requests" ON public.leave_requests
  FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create leave requests" ON public.leave_requests
  FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update leave requests" ON public.leave_requests
  FOR UPDATE USING (has_facility_access(facility_id));

-- Projects
CREATE POLICY "Users can view own facility projects" ON public.projects
  FOR SELECT USING (has_facility_access(facility_id));
CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (has_facility_access(facility_id));
CREATE POLICY "Users can update projects" ON public.projects
  FOR UPDATE USING (has_facility_access(facility_id));
CREATE POLICY "Users can delete projects" ON public.projects
  FOR DELETE USING (has_facility_access(facility_id));

-- Tasks (inherit project access)
CREATE POLICY "Users can view tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
      AND has_facility_access(projects.facility_id)
    )
  );

-- Qurban Campaigns
CREATE POLICY "Users can view own facility campaigns" ON public.qurban_campaigns
  FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can create campaigns" ON public.qurban_campaigns
  FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));
CREATE POLICY "Users can update campaigns" ON public.qurban_campaigns
  FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Categories, Vendors: Global or facility-scoped
CREATE POLICY "Users can view categories" ON public.categories
  FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));

CREATE POLICY "Users can view vendors_customers" ON public.vendors_customers
  FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Departments
CREATE POLICY "Users can view departments" ON public.departments
  FOR SELECT USING (has_facility_access(facility_id));

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_transactions_facility_id ON public.transactions(facility_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_budgets_facility_id ON public.budgets(facility_id);
CREATE INDEX idx_employees_facility_id ON public.employees(facility_id);
CREATE INDEX idx_projects_facility_id ON public.projects(facility_id);
CREATE INDEX idx_qurban_donations_campaign_id ON public.qurban_donations(campaign_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_facility_users_user_id ON public.facility_users(user_id);
CREATE INDEX idx_facility_users_facility_id ON public.facility_users(facility_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS (Run in Supabase Dashboard)
-- ============================================

-- Documents bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Receipts bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Avatars bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Project files bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

-- Storage policies will allow users to upload/download files for their facilities
