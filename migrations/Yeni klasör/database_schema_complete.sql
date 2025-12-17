-- =============================================================================
-- NGO YÖNETİM SİSTEMİ - KAPSAMLI VERİTABANI ŞEMASI
-- =============================================================================
-- Bu dosya tüm tabloları, ilişkileri, fonksiyonları, trigger'ları ve RLS politikalarını içerir
-- Yeni bir Supabase projesinde çalıştırılabilir
-- =============================================================================
-- OLUŞTURULMA TARİHİ: 2024-12-04
-- =============================================================================

-- =============================================================================
-- BÖLÜM 1: EXTENSION'LAR
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- BÖLÜM 2: ENUM TİPLERİ
-- =============================================================================
DO $$ BEGIN
    CREATE TYPE facility_type AS ENUM ('headquarters', 'branch');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE budget_status AS ENUM ('draft', 'pending', 'active', 'completed', 'exceeded', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE budget_period AS ENUM ('monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payroll_status AS ENUM ('draft', 'pending', 'approved', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE donation_status AS ENUM ('pending', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('draft', 'pending_approval', 'active', 'completed', 'cancelled', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- BÖLÜM 3: TABLOLAR
-- =============================================================================

-- PROFILES (Kullanıcı profilleri)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'User',
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FACILITIES (Tesisler)
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type facility_type DEFAULT 'branch',
    location TEXT,
    parent_facility_id UUID REFERENCES public.facilities(id),
    enabled_modules TEXT[] DEFAULT ARRAY['finance', 'hr', 'projects', 'qurban'],
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FACILITY_USERS (Tesis-Kullanıcı ilişkisi)
CREATE TABLE IF NOT EXISTS public.facility_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, facility_id)
);

-- DEPARTMENTS (Departmanlar)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    manager_id UUID,
    parent_department_id UUID REFERENCES public.departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOB_TITLES (İş Unvanları)
CREATE TABLE IF NOT EXISTS public.job_titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    min_salary DECIMAL(15,2),
    max_salary DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMPLOYEES (Çalışanlar)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    national_id TEXT,
    birth_date DATE,
    gender TEXT,
    marital_status TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Türkiye',
    postal_code TEXT,
    department_id UUID REFERENCES public.departments(id),
    job_title_id UUID REFERENCES public.job_titles(id),
    hire_date DATE,
    employment_type TEXT DEFAULT 'full_time',
    salary DECIMAL(15,2),
    currency TEXT DEFAULT 'TRY',
    bank_name TEXT,
    iban TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    profile_photo TEXT,
    documents JSONB DEFAULT '[]',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATTENDANCE (Devamsızlık)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT DEFAULT 'present',
    notes TEXT,
    late_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATTENDANCE_RECORDS (Devamsızlık Kayıtları)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAVE_REQUESTS (İzin Talepleri)
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    approver_id UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    documents JSONB DEFAULT '[]',
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYROLLS (Maaş Bordroları)
CREATE TABLE IF NOT EXISTS public.payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary DECIMAL(15,2) NOT NULL,
    overtime_pay DECIMAL(15,2) DEFAULT 0,
    bonus DECIMAL(15,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    tax DECIMAL(15,2) DEFAULT 0,
    insurance DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    status payroll_status DEFAULT 'draft',
    payment_date DATE,
    notes TEXT,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYROLL_RECORDS (Maaş Kayıtları)
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    base_salary DECIMAL(15,2),
    bonuses DECIMAL(15,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2),
    status payroll_status DEFAULT 'draft',
    payment_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES (Kategoriler)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    parent_id UUID REFERENCES public.categories(id),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHART_OF_ACCOUNTS (Hesap Planı)
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    parent_id UUID REFERENCES public.chart_of_accounts(id),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VENDORS_CUSTOMERS (Tedarikçiler & Müşteriler)
CREATE TABLE IF NOT EXISTS public.vendors_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'vendor' or 'customer'
    tax_number TEXT,
    email TEXT,
    phone TEXT,
    contact_person TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Türkiye',
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    is_quarantined BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS (Finansal İşlemler)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    category_id UUID REFERENCES public.categories(id),
    subcategory_id UUID REFERENCES public.categories(id),
    description TEXT,
    date DATE NOT NULL,
    vendor_customer_id UUID REFERENCES public.vendors_customers(id),
    department_id UUID REFERENCES public.departments(id),
    project_id UUID,
    payment_method TEXT,
    reference_number TEXT,
    receipt_url TEXT,
    documents JSONB DEFAULT '[]',
    status transaction_status DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    tags TEXT[],
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BUDGETS (Bütçeler)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    total_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    category_id UUID REFERENCES public.categories(id),
    department_id UUID REFERENCES public.departments(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    period budget_period DEFAULT 'monthly',
    status budget_status DEFAULT 'draft',
    project_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BUDGET_TRANSFERS (Bütçe Aktarımları)
CREATE TABLE IF NOT EXISTS public.budget_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_facility_id UUID NOT NULL REFERENCES public.facilities(id),
    to_facility_id UUID NOT NULL REFERENCES public.facilities(id),
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    description TEXT,
    status transaction_status DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    documents JSONB DEFAULT '[]',
    notes TEXT,
    transfer_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS (Projeler)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'planning',
    priority task_priority DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    spent_budget DECIMAL(15,2) DEFAULT 0,
    manager_id UUID REFERENCES public.employees(id),
    category_id UUID,
    type_id UUID,
    progress INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    total_team_members INTEGER DEFAULT 0,
    tags TEXT[],
    is_deleted BOOLEAN DEFAULT false,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT_CATEGORIES (Proje Kategorileri)
CREATE TABLE IF NOT EXISTS public.project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT_TYPES (Proje Tipleri)
CREATE TABLE IF NOT EXISTS public.project_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'folder',
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT_TEAM_MEMBERS (Proje Ekip Üyeleri)
CREATE TABLE IF NOT EXISTS public.project_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, employee_id)
);

-- PROJECT_MILESTONES (Proje Kilometre Taşları)
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT_TASKS (Proje Görevleri)
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    assignee_id UUID REFERENCES public.employees(id),
    due_date DATE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    milestone_id UUID REFERENCES public.project_milestones(id),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT_ACTIVITIES (Proje Aktiviteleri)
CREATE TABLE IF NOT EXISTS public.project_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT_DOCUMENTS (Proje Belgeleri)
CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT_TRANSACTIONS (Proje Finansal İşlemleri)
CREATE TABLE IF NOT EXISTS public.project_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id),
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    description TEXT,
    date DATE NOT NULL,
    category TEXT,
    vendor_customer_id UUID REFERENCES public.vendors_customers(id),
    receipt_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MILESTONES (Eski - uyumluluk için)
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS (Eski - uyumluluk için)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    assignee_id UUID REFERENCES public.employees(id),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QURBAN_CAMPAIGNS (Kurban Kampanyaları)
CREATE TABLE IF NOT EXISTS public.qurban_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    animal_type TEXT NOT NULL,
    price_per_share DECIMAL(15,2) NOT NULL,
    shares_per_animal INTEGER DEFAULT 7,
    target_amount DECIMAL(15,2),
    collected_amount DECIMAL(15,2) DEFAULT 0,
    target_animals INTEGER,
    collected_animals INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status campaign_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QURBAN_DONATIONS (Kurban Bağışları)
CREATE TABLE IF NOT EXISTS public.qurban_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.qurban_campaigns(id) ON DELETE CASCADE,
    donor_name TEXT NOT NULL,
    donor_phone TEXT,
    donor_email TEXT,
    donor_address TEXT,
    share_count INTEGER DEFAULT 1,
    amount DECIMAL(15,2) NOT NULL,
    payment_method TEXT,
    payment_reference TEXT,
    status donation_status DEFAULT 'pending',
    notes TEXT,
    on_behalf_of TEXT,
    delivery_preference TEXT DEFAULT 'pickup',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QURBAN_SCHEDULES (Kesim Programları)
CREATE TABLE IF NOT EXISTS public.qurban_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.qurban_campaigns(id) ON DELETE CASCADE,
    slaughter_date DATE NOT NULL,
    slaughter_time TIME,
    location TEXT,
    animal_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISTRIBUTION_RECORDS (Et Dağıtım Kayıtları)
CREATE TABLE IF NOT EXISTS public.distribution_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.qurban_campaigns(id) ON DELETE SET NULL,
    donation_id UUID REFERENCES public.qurban_donations(id) ON DELETE SET NULL,
    distribution_type TEXT DEFAULT 'personal',
    recipient_name TEXT,
    recipient_phone TEXT,
    recipient_address TEXT,
    package_code TEXT,
    estimated_weight DECIMAL(10,2),
    actual_weight DECIMAL(10,2),
    distribution_date DATE,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CALENDAR_EVENTS (Takvim Etkinlikleri)
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    type TEXT DEFAULT 'event',
    color TEXT DEFAULT '#3B82F6',
    location TEXT,
    attendees JSONB DEFAULT '[]',
    reminder BOOLEAN DEFAULT false,
    reminder_minutes INTEGER DEFAULT 30,
    recurring BOOLEAN DEFAULT false,
    recurring_pattern TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS (Bildirimler)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    priority TEXT DEFAULT 'normal',
    link TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- APPROVAL_REQUESTS (Onay Talepleri)
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_data JSONB,
    title TEXT NOT NULL,
    description TEXT,
    status approval_status DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    requester_id UUID REFERENCES auth.users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approver_id UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPROVAL_STEPS (Onay Adımları)
CREATE TABLE IF NOT EXISTS public.approval_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_id UUID REFERENCES auth.users(id),
    status approval_status DEFAULT 'pending',
    notes TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY_LOGS (Aktivite Kayıtları)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- BÖLÜM 4: INDEX'LER
-- =============================================================================

-- Facility indexes
CREATE INDEX IF NOT EXISTS idx_facilities_parent_facility_id ON public.facilities(parent_facility_id);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON public.facilities(type);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_facility_users_user_id ON public.facility_users(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_users_facility_id ON public.facility_users(facility_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

-- Employee indexes
CREATE INDEX IF NOT EXISTS idx_employees_facility_id ON public.employees(facility_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_organization_id ON public.employees(organization_id);

-- Department indexes
CREATE INDEX IF NOT EXISTS idx_departments_facility_id ON public.departments(facility_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON public.departments(manager_id);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_transactions_facility_id ON public.transactions(facility_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_department_id ON public.transactions(department_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_approved_by ON public.transactions(approved_by);
CREATE INDEX IF NOT EXISTS idx_transactions_vendor_customer_id ON public.transactions(vendor_customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON public.transactions(organization_id);

-- Budget indexes
CREATE INDEX IF NOT EXISTS idx_budgets_facility_id ON public.budgets(facility_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON public.budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_department_id ON public.budgets(department_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON public.budgets(project_id);

-- Budget transfer indexes
CREATE INDEX IF NOT EXISTS idx_budget_transfers_from_facility_id ON public.budget_transfers(from_facility_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_to_facility_id ON public.budget_transfers(to_facility_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_approved_by ON public.budget_transfers(approved_by);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_rejected_by ON public.budget_transfers(rejected_by);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_created_by ON public.budget_transfers(created_by);

-- Project indexes
CREATE INDEX IF NOT EXISTS idx_projects_facility_id ON public.projects(facility_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);

-- Project related indexes
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee_id ON public.project_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_employee_id ON public.project_team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON public.project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_user_id ON public.project_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_uploaded_by ON public.project_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_project_transactions_project_id ON public.project_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_transactions_transaction_id ON public.project_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_project_transactions_created_by ON public.project_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_project_transactions_vendor_customer_id ON public.project_transactions(vendor_customer_id);
CREATE INDEX IF NOT EXISTS idx_project_categories_facility_id ON public.project_categories(facility_id);
CREATE INDEX IF NOT EXISTS idx_project_types_facility_id ON public.project_types(facility_id);

-- HR indexes
CREATE INDEX IF NOT EXISTS idx_attendance_organization_id ON public.attendance(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_facility_id ON public.attendance_records(facility_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_facility_id ON public.leave_requests(facility_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_approver_id ON public.leave_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_organization_id ON public.leave_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_facility_id ON public.payroll_records(facility_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON public.payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_employee_id ON public.payrolls(employee_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_organization_id ON public.payrolls(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_titles_department_id ON public.job_titles(department_id);
CREATE INDEX IF NOT EXISTS idx_job_titles_facility_id ON public.job_titles(facility_id);

-- Qurban indexes
CREATE INDEX IF NOT EXISTS idx_qurban_campaigns_facility_id ON public.qurban_campaigns(facility_id);
CREATE INDEX IF NOT EXISTS idx_qurban_donations_facility_id ON public.qurban_donations(facility_id);
CREATE INDEX IF NOT EXISTS idx_qurban_schedules_facility_id ON public.qurban_schedules(facility_id);
CREATE INDEX IF NOT EXISTS idx_distribution_records_facility_id ON public.distribution_records(facility_id);
CREATE INDEX IF NOT EXISTS idx_distribution_records_campaign_id ON public.distribution_records(campaign_id);

-- Category indexes
CREATE INDEX IF NOT EXISTS idx_categories_facility_id ON public.categories(facility_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_facility_id ON public.chart_of_accounts(facility_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_id ON public.chart_of_accounts(parent_id);

-- Vendor/Customer indexes
CREATE INDEX IF NOT EXISTS idx_vendors_customers_facility_id ON public.vendors_customers(facility_id);
CREATE INDEX IF NOT EXISTS idx_vendors_customers_organization_id ON public.vendors_customers(organization_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Approval indexes
CREATE INDEX IF NOT EXISTS idx_approval_requests_facility_id ON public.approval_requests(facility_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester_id ON public.approval_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approver_id ON public.approval_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_approval_request_id ON public.approval_steps(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_approver_id ON public.approval_steps(approver_id);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_facility_id ON public.activity_logs(facility_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);

-- Task indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);

-- =============================================================================
-- BÖLÜM 5: FONKSİYONLAR
-- =============================================================================

-- Updated at trigger function
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

-- Handle new user function (trigger için)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_count INTEGER;
    user_role TEXT;
    default_facility_id UUID;
BEGIN
    -- Count existing profiles
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- First user gets Super Admin
    IF user_count = 0 THEN
        user_role := 'Super Admin';
    ELSE
        user_role := 'User';
    END IF;
    
    -- Create profile
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        user_role,
        NOW(),
        NOW()
    );
    
    -- Create or get default facility
    SELECT id INTO default_facility_id FROM public.facilities WHERE code = 'GM01';
    
    IF default_facility_id IS NULL THEN
        INSERT INTO public.facilities (code, name, type, location, enabled_modules)
        VALUES ('GM01', 'Genel Merkez', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
        RETURNING id INTO default_facility_id;
    END IF;
    
    -- Grant facility access
    INSERT INTO public.facility_users (user_id, facility_id)
    VALUES (NEW.id, default_facility_id)
    ON CONFLICT (user_id, facility_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Seed default departments function
CREATE OR REPLACE FUNCTION public.seed_default_departments(p_facility_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.departments (facility_id, name, description)
    VALUES 
        (p_facility_id, 'Yönetim', 'Üst yönetim ve strateji'),
        (p_facility_id, 'Finans', 'Mali işler ve muhasebe'),
        (p_facility_id, 'İnsan Kaynakları', 'Personel yönetimi'),
        (p_facility_id, 'Operasyon', 'Günlük operasyonlar')
    ON CONFLICT DO NOTHING;
END;
$$;

-- Has facility access function
CREATE OR REPLACE FUNCTION public.has_facility_access(p_user_id UUID, p_facility_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.facility_users
        WHERE user_id = p_user_id AND facility_id = p_facility_id
    );
END;
$$;

-- Calculate campaign stats function
CREATE OR REPLACE FUNCTION public.calculate_campaign_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.qurban_campaigns
        SET collected_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.qurban_donations
            WHERE campaign_id = NEW.campaign_id AND status = 'paid'
        )
        WHERE id = NEW.campaign_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Increment campaign collected function
CREATE OR REPLACE FUNCTION public.increment_campaign_collected(p_campaign_id UUID, p_amount DECIMAL)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE public.qurban_campaigns
    SET collected_amount = COALESCE(collected_amount, 0) + p_amount
    WHERE id = p_campaign_id;
END;
$$;

-- Decrement campaign collected function
CREATE OR REPLACE FUNCTION public.decrement_campaign_collected(p_campaign_id UUID, p_amount DECIMAL)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE public.qurban_campaigns
    SET collected_amount = GREATEST(COALESCE(collected_amount, 0) - p_amount, 0)
    WHERE id = p_campaign_id;
END;
$$;

-- Update project stats functions
CREATE OR REPLACE FUNCTION public.update_project_task_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.projects
        SET 
            total_tasks = (SELECT COUNT(*) FROM public.project_tasks WHERE project_id = OLD.project_id),
            completed_tasks = (SELECT COUNT(*) FROM public.project_tasks WHERE project_id = OLD.project_id AND status = 'done')
        WHERE id = OLD.project_id;
        RETURN OLD;
    ELSE
        UPDATE public.projects
        SET 
            total_tasks = (SELECT COUNT(*) FROM public.project_tasks WHERE project_id = NEW.project_id),
            completed_tasks = (SELECT COUNT(*) FROM public.project_tasks WHERE project_id = NEW.project_id AND status = 'done')
        WHERE id = NEW.project_id;
        RETURN NEW;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_project_team_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.projects
        SET total_team_members = (SELECT COUNT(*) FROM public.project_team_members WHERE project_id = OLD.project_id)
        WHERE id = OLD.project_id;
        RETURN OLD;
    ELSE
        UPDATE public.projects
        SET total_team_members = (SELECT COUNT(*) FROM public.project_team_members WHERE project_id = NEW.project_id)
        WHERE id = NEW.project_id;
        RETURN NEW;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_project_finance_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.projects
        SET spent_budget = (SELECT COALESCE(SUM(amount), 0) FROM public.project_transactions WHERE project_id = OLD.project_id AND type = 'expense')
        WHERE id = OLD.project_id;
        RETURN OLD;
    ELSE
        UPDATE public.projects
        SET spent_budget = (SELECT COALESCE(SUM(amount), 0) FROM public.project_transactions WHERE project_id = NEW.project_id AND type = 'expense')
        WHERE id = NEW.project_id;
        RETURN NEW;
    END IF;
END;
$$;

-- =============================================================================
-- BÖLÜM 6: TRIGGER'LAR
-- =============================================================================

-- Auth user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_facilities_updated_at ON public.facilities;
CREATE TRIGGER update_facilities_updated_at
    BEFORE UPDATE ON public.facilities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Project stats triggers
DROP TRIGGER IF EXISTS trigger_update_project_task_stats ON public.project_tasks;
CREATE TRIGGER trigger_update_project_task_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.project_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_project_task_stats();

DROP TRIGGER IF EXISTS trigger_update_project_team_stats ON public.project_team_members;
CREATE TRIGGER trigger_update_project_team_stats
    AFTER INSERT OR DELETE ON public.project_team_members
    FOR EACH ROW EXECUTE FUNCTION public.update_project_team_stats();

DROP TRIGGER IF EXISTS trigger_update_project_finance_stats ON public.project_transactions;
CREATE TRIGGER trigger_update_project_finance_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.project_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_project_finance_stats();

-- =============================================================================
-- BÖLÜM 7: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES - PROFILES
-- =============================================================================
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- =============================================================================
-- RLS POLICIES - FACILITIES
-- =============================================================================
DROP POLICY IF EXISTS "facilities_select_all" ON public.facilities;
CREATE POLICY "facilities_select_all" ON public.facilities FOR SELECT USING (true);

DROP POLICY IF EXISTS "facilities_insert_auth" ON public.facilities;
CREATE POLICY "facilities_insert_auth" ON public.facilities FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "facilities_update_auth" ON public.facilities;
CREATE POLICY "facilities_update_auth" ON public.facilities FOR UPDATE USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "facilities_delete_auth" ON public.facilities;
CREATE POLICY "facilities_delete_auth" ON public.facilities FOR DELETE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
-- RLS POLICIES - FACILITY_USERS
-- =============================================================================
DROP POLICY IF EXISTS "facility_users_select_all" ON public.facility_users;
CREATE POLICY "facility_users_select_all" ON public.facility_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "facility_users_insert_auth" ON public.facility_users;
CREATE POLICY "facility_users_insert_auth" ON public.facility_users FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "facility_users_update_auth" ON public.facility_users;
CREATE POLICY "facility_users_update_auth" ON public.facility_users FOR UPDATE USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "facility_users_delete_auth" ON public.facility_users;
CREATE POLICY "facility_users_delete_auth" ON public.facility_users FOR DELETE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
-- RLS POLICIES - ALL OTHER TABLES (Authenticated users can do everything)
-- =============================================================================

-- Departments
DROP POLICY IF EXISTS "departments_all" ON public.departments;
CREATE POLICY "departments_all" ON public.departments FOR ALL USING ((select auth.role()) = 'authenticated');

-- Job Titles
DROP POLICY IF EXISTS "job_titles_all" ON public.job_titles;
CREATE POLICY "job_titles_all" ON public.job_titles FOR ALL USING ((select auth.role()) = 'authenticated');

-- Employees
DROP POLICY IF EXISTS "employees_all" ON public.employees;
CREATE POLICY "employees_all" ON public.employees FOR ALL USING ((select auth.role()) = 'authenticated');

-- Attendance
DROP POLICY IF EXISTS "attendance_all" ON public.attendance;
CREATE POLICY "attendance_all" ON public.attendance FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "attendance_records_all" ON public.attendance_records;
CREATE POLICY "attendance_records_all" ON public.attendance_records FOR ALL USING ((select auth.role()) = 'authenticated');

-- Leave Requests
DROP POLICY IF EXISTS "leave_requests_all" ON public.leave_requests;
CREATE POLICY "leave_requests_all" ON public.leave_requests FOR ALL USING ((select auth.role()) = 'authenticated');

-- Payrolls
DROP POLICY IF EXISTS "payrolls_all" ON public.payrolls;
CREATE POLICY "payrolls_all" ON public.payrolls FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "payroll_records_all" ON public.payroll_records;
CREATE POLICY "payroll_records_all" ON public.payroll_records FOR ALL USING ((select auth.role()) = 'authenticated');

-- Categories
DROP POLICY IF EXISTS "categories_all" ON public.categories;
CREATE POLICY "categories_all" ON public.categories FOR ALL USING ((select auth.role()) = 'authenticated');

-- Chart of Accounts
DROP POLICY IF EXISTS "chart_of_accounts_all" ON public.chart_of_accounts;
CREATE POLICY "chart_of_accounts_all" ON public.chart_of_accounts FOR ALL USING ((select auth.role()) = 'authenticated');

-- Vendors/Customers
DROP POLICY IF EXISTS "vendors_customers_all" ON public.vendors_customers;
CREATE POLICY "vendors_customers_all" ON public.vendors_customers FOR ALL USING ((select auth.role()) = 'authenticated');

-- Transactions
DROP POLICY IF EXISTS "transactions_all" ON public.transactions;
CREATE POLICY "transactions_all" ON public.transactions FOR ALL USING ((select auth.role()) = 'authenticated');

-- Budgets
DROP POLICY IF EXISTS "budgets_all" ON public.budgets;
CREATE POLICY "budgets_all" ON public.budgets FOR ALL USING ((select auth.role()) = 'authenticated');

-- Budget Transfers
DROP POLICY IF EXISTS "budget_transfers_all" ON public.budget_transfers;
CREATE POLICY "budget_transfers_all" ON public.budget_transfers FOR ALL USING ((select auth.role()) = 'authenticated');

-- Projects
DROP POLICY IF EXISTS "projects_all" ON public.projects;
CREATE POLICY "projects_all" ON public.projects FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "project_categories_all" ON public.project_categories;
CREATE POLICY "project_categories_all" ON public.project_categories FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "project_types_all" ON public.project_types;
CREATE POLICY "project_types_all" ON public.project_types FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "project_team_members_all" ON public.project_team_members;
CREATE POLICY "project_team_members_all" ON public.project_team_members FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "project_milestones_all" ON public.project_milestones;
CREATE POLICY "project_milestones_all" ON public.project_milestones FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "project_tasks_all" ON public.project_tasks;
CREATE POLICY "project_tasks_all" ON public.project_tasks FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "project_activities_all" ON public.project_activities;
CREATE POLICY "project_activities_all" ON public.project_activities FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "project_documents_all" ON public.project_documents;
CREATE POLICY "project_documents_all" ON public.project_documents FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "project_transactions_all" ON public.project_transactions;
CREATE POLICY "project_transactions_all" ON public.project_transactions FOR ALL USING ((select auth.role()) = 'authenticated');

-- Tasks & Milestones (legacy)
DROP POLICY IF EXISTS "tasks_all" ON public.tasks;
CREATE POLICY "tasks_all" ON public.tasks FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "milestones_all" ON public.milestones;
CREATE POLICY "milestones_all" ON public.milestones FOR ALL USING ((select auth.role()) = 'authenticated');

-- Qurban
DROP POLICY IF EXISTS "qurban_campaigns_all" ON public.qurban_campaigns;
CREATE POLICY "qurban_campaigns_all" ON public.qurban_campaigns FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "qurban_donations_all" ON public.qurban_donations;
CREATE POLICY "qurban_donations_all" ON public.qurban_donations FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "qurban_schedules_all" ON public.qurban_schedules;
CREATE POLICY "qurban_schedules_all" ON public.qurban_schedules FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "distribution_records_all" ON public.distribution_records;
CREATE POLICY "distribution_records_all" ON public.distribution_records FOR ALL USING ((select auth.role()) = 'authenticated');

-- Calendar
DROP POLICY IF EXISTS "calendar_events_all" ON public.calendar_events;
CREATE POLICY "calendar_events_all" ON public.calendar_events FOR ALL USING ((select auth.role()) = 'authenticated');

-- Notifications (user-specific)
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notifications_insert_auth" ON public.notifications;
CREATE POLICY "notifications_insert_auth" ON public.notifications FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- Approval Requests
DROP POLICY IF EXISTS "approval_requests_all" ON public.approval_requests;
CREATE POLICY "approval_requests_all" ON public.approval_requests FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "approval_steps_all" ON public.approval_steps;
CREATE POLICY "approval_steps_all" ON public.approval_steps FOR ALL USING ((select auth.role()) = 'authenticated');

-- Activity Logs
DROP POLICY IF EXISTS "activity_logs_all" ON public.activity_logs;
CREATE POLICY "activity_logs_all" ON public.activity_logs FOR ALL USING ((select auth.role()) = 'authenticated');

-- =============================================================================
-- EKSİK TABLOLAR
-- =============================================================================

-- FORM_TEMPLATES (Form Şablonları)
CREATE TABLE IF NOT EXISTS public.form_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    fields JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS (Ayarlar)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(facility_id, key)
);

-- Enable RLS on new tables
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
DROP POLICY IF EXISTS "form_templates_all" ON public.form_templates;
CREATE POLICY "form_templates_all" ON public.form_templates FOR ALL USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "settings_all" ON public.settings;
CREATE POLICY "settings_all" ON public.settings FOR ALL USING ((select auth.role()) = 'authenticated');

-- =============================================================================
-- BÖLÜM 8: VARSAYILAN VERİLER (OPSİYONEL - YORUM SATIRINDA)
-- =============================================================================

-- Varsayılan tesis (ilk kullanıcı kaydında otomatik oluşturulur)
-- INSERT INTO public.facilities (code, name, type, location, enabled_modules)
-- VALUES ('GM01', 'Genel Merkez', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
-- ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- TAMAMLANDI
-- =============================================================================

SELECT 'Veritabanı şeması başarıyla oluşturuldu!' as status;
SELECT 'Tablolar, index''ler, fonksiyonlar, trigger''lar ve RLS politikaları hazır.' as bilgi;
SELECT 'Şimdi kullanıcı kaydı yapabilirsiniz.' as sonraki_adim;

