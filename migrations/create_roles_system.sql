-- =============================================================================
-- ROL VE YETKİLENDİRME SİSTEMİ
-- =============================================================================
-- Bu migration, sistem genelinde rol yönetimi için gerekli tabloları oluşturur
-- Super Admin yeni roller oluşturabilir, düzenleyebilir ve silinebilir
-- Rollere modül bazlı izinler tanımlanabilir
-- Kullanıcılara tesis bazlı rol atanabilir
-- =============================================================================

-- =============================================================================
-- 1. ROL TANIMLARI TABLOSU
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- Rol adı (örn: "Muhasebeci", "Proje Yöneticisi")
  description TEXT, -- Rol açıklaması
  is_system_role BOOLEAN DEFAULT false, -- Sistem rolü mü (silinemez)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- =============================================================================
-- 2. ROL İZİNLERİ TABLOSU
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  
  -- Modül izinleri
  module TEXT NOT NULL CHECK (module IN ('finance', 'hr', 'projects', 'qurban', 'reports', 'approvals', 'calendar', 'settings')),
  
  -- İzinler
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false, -- Onaylama yetkisi
  can_export BOOLEAN DEFAULT false, -- Rapor export (reports modülü için)
  can_reject BOOLEAN DEFAULT false, -- Reddetme yetkisi (approvals modülü için)
  
  -- Proje bazlı erişim (projects modülü için)
  project_access_type TEXT DEFAULT 'all' CHECK (project_access_type IN ('all', 'assigned', 'department', 'facility')),
  -- 'all': Tüm projelere erişim
  -- 'assigned': Sadece atandığı projelere erişim
  -- 'department': Departmanındaki projelere erişim
  -- 'facility': Tesisindeki tüm projelere erişim
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role_id, module)
);

-- =============================================================================
-- 3. KULLANICI-TESİS-ROL İLİŞKİSİ
-- =============================================================================
-- Bir kullanıcı farklı tesislerde farklı rollere sahip olabilir
CREATE TABLE IF NOT EXISTS public.user_facility_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  
  -- Proje bazlı erişim için ek bilgiler (opsiyonel)
  department_id UUID REFERENCES public.departments(id), -- Departman bazlı erişim için
  project_ids UUID[], -- Belirli projelere erişim için (project_access_type = 'assigned' ise)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  
  UNIQUE(user_id, facility_id, role_id)
);

-- =============================================================================
-- 4. INDEX'LER
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_system ON public.roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON public.role_permissions(module);
CREATE INDEX IF NOT EXISTS idx_user_facility_roles_user ON public.user_facility_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_facility_roles_facility ON public.user_facility_roles(facility_id);
CREATE INDEX IF NOT EXISTS idx_user_facility_roles_role ON public.user_facility_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_facility_roles_user_facility ON public.user_facility_roles(user_id, facility_id);

-- =============================================================================
-- 5. VARSayılan SİSTEM ROLLERİ
-- =============================================================================
-- Super Admin, Admin, Manager, User rolleri sistem rolleri olarak eklenir
INSERT INTO public.roles (name, description, is_system_role, created_at, updated_at)
VALUES 
  ('Super Admin', 'Tüm yetkilere sahip sistem yöneticisi', true, NOW(), NOW()),
  ('Admin', 'Yönetim yetkilerine sahip kullanıcı', true, NOW(), NOW()),
  ('Manager', 'Orta seviye yetkilere sahip kullanıcı', true, NOW(), NOW()),
  ('User', 'Temel yetkilere sahip kullanıcı', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 6. VARSayılan İZİNLER (Super Admin için)
-- =============================================================================
DO $$
DECLARE
  v_super_admin_role_id UUID;
BEGIN
  SELECT id INTO v_super_admin_role_id FROM public.roles WHERE name = 'Super Admin';
  
  IF v_super_admin_role_id IS NOT NULL THEN
    -- Super Admin tüm modüllere tam erişim
    INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_approve, can_export, can_reject, project_access_type)
    VALUES 
      (v_super_admin_role_id, 'finance', true, true, true, true, true, true, true, 'all'),
      (v_super_admin_role_id, 'hr', true, true, true, true, true, true, true, 'all'),
      (v_super_admin_role_id, 'projects', true, true, true, true, true, true, true, 'all'),
      (v_super_admin_role_id, 'qurban', true, true, true, true, true, true, true, 'all'),
      (v_super_admin_role_id, 'reports', true, true, true, true, true, true, true, 'all'),
      (v_super_admin_role_id, 'approvals', true, true, true, true, true, true, true, 'all'),
      (v_super_admin_role_id, 'calendar', true, true, true, true, true, true, true, 'all'),
      (v_super_admin_role_id, 'settings', true, true, true, true, true, true, true, 'all')
    ON CONFLICT (role_id, module) DO NOTHING;
  END IF;
END $$;

-- =============================================================================
-- 7. RLS POLİTİKALARI
-- =============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_facility_roles ENABLE ROW LEVEL SECURITY;

-- Roles: Herkes görebilir, sadece Super Admin oluşturabilir/düzenleyebilir
CREATE POLICY "Users can view all roles" ON public.roles
  FOR SELECT USING (true);

CREATE POLICY "Super Admin can manage roles" ON public.roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin')
  );

-- Role Permissions: Herkes görebilir, sadece Super Admin yönetebilir
CREATE POLICY "Users can view role permissions" ON public.role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Super Admin can manage role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin')
  );

-- User Facility Roles: Kullanıcılar kendi rollerini görebilir, Super Admin yönetebilir
CREATE POLICY "Users can view own facility roles" ON public.user_facility_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super Admin can manage user facility roles" ON public.user_facility_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin')
  );

-- =============================================================================
-- 8. HELPER FUNCTIONS
-- =============================================================================

-- Kullanıcının belirli bir tesiste hangi role sahip olduğunu getir
CREATE OR REPLACE FUNCTION get_user_role_in_facility(
  p_user_id UUID,
  p_facility_id UUID
)
RETURNS TABLE (
  role_id UUID,
  role_name TEXT,
  permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    jsonb_object_agg(
      rp.module,
      jsonb_build_object(
        'can_view', rp.can_view,
        'can_create', rp.can_create,
        'can_edit', rp.can_edit,
        'can_delete', rp.can_delete,
        'can_approve', rp.can_approve,
        'can_export', rp.can_export,
        'can_reject', rp.can_reject,
        'project_access_type', rp.project_access_type
      )
    ) as permissions
  FROM public.user_facility_roles ufr
  JOIN public.roles r ON r.id = ufr.role_id
  LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
  WHERE ufr.user_id = p_user_id
    AND ufr.facility_id = p_facility_id
  GROUP BY r.id, r.name
  LIMIT 1;
END;
$$;

-- Kullanıcının belirli bir modüle erişimi var mı kontrol et
CREATE OR REPLACE FUNCTION has_module_access(
  p_user_id UUID,
  p_facility_id UUID,
  p_module TEXT,
  p_permission TEXT DEFAULT 'view' -- 'view', 'create', 'edit', 'delete', 'approve', 'export', 'reject'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_access BOOLEAN := false;
  v_user_role TEXT;
BEGIN
  -- Super Admin her zaman erişebilir
  SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;
  IF v_user_role = 'Super Admin' THEN
    RETURN true;
  END IF;
  
  -- Kullanıcının tesiste hangi role sahip olduğunu kontrol et
  SELECT 
    CASE p_permission
      WHEN 'view' THEN rp.can_view
      WHEN 'create' THEN rp.can_create
      WHEN 'edit' THEN rp.can_edit
      WHEN 'delete' THEN rp.can_delete
      WHEN 'approve' THEN rp.can_approve
      WHEN 'export' THEN rp.can_export
      WHEN 'reject' THEN rp.can_reject
      ELSE false
    END INTO v_has_access
  FROM public.user_facility_roles ufr
  JOIN public.role_permissions rp ON rp.role_id = ufr.role_id
  WHERE ufr.user_id = p_user_id
    AND ufr.facility_id = p_facility_id
    AND rp.module = p_module
  LIMIT 1;
  
  RETURN COALESCE(v_has_access, false);
END;
$$;

-- Kullanıcının projeye erişimi var mı kontrol et
CREATE OR REPLACE FUNCTION has_project_access(
  p_user_id UUID,
  p_facility_id UUID,
  p_project_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_access BOOLEAN := false;
  v_user_role TEXT;
  v_project_access_type TEXT;
  v_user_department TEXT;
  v_project_facility_id UUID;
  v_project_manager_id UUID;
  v_project_department_id UUID;
BEGIN
  -- Super Admin her zaman erişebilir
  SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;
  IF v_user_role = 'Super Admin' THEN
    RETURN true;
  END IF;
  
  -- Proje bilgilerini al
  SELECT 
    facility_id,
    manager_id,
    department_id
  INTO 
    v_project_facility_id,
    v_project_manager_id,
    v_project_department_id
  FROM public.projects
  WHERE id = p_project_id;
  
  -- Tesis kontrolü
  IF v_project_facility_id != p_facility_id THEN
    RETURN false;
  END IF;
  
  -- Kullanıcının rolünü ve proje erişim tipini al
  SELECT 
    rp.project_access_type,
    p.department
  INTO 
    v_project_access_type,
    v_user_department
  FROM public.user_facility_roles ufr
  JOIN public.role_permissions rp ON rp.role_id = ufr.role_id
  JOIN public.profiles p ON p.id = p_user_id
  WHERE ufr.user_id = p_user_id
    AND ufr.facility_id = p_facility_id
    AND rp.module = 'projects'
    AND rp.can_view = true
  LIMIT 1;
  
  -- Erişim tipine göre kontrol
  CASE v_project_access_type
    WHEN 'all' THEN
      -- Tüm projelere erişim
      v_has_access := true;
    WHEN 'assigned' THEN
      -- Sadece atandığı projelere erişim
      v_has_access := (v_project_manager_id = p_user_id OR 
                      EXISTS (
                        SELECT 1 FROM public.project_team_members 
                        WHERE project_id = p_project_id AND user_id = p_user_id
                      ));
    WHEN 'department' THEN
      -- Departmanındaki projelere erişim
      v_has_access := (v_project_department_id IS NOT NULL AND 
                      EXISTS (
                        SELECT 1 FROM public.employees 
                        WHERE id = p_user_id AND department = (
                          SELECT name FROM public.departments WHERE id = v_project_department_id
                        )
                      ));
    WHEN 'facility' THEN
      -- Tesisindeki tüm projelere erişim
      v_has_access := true;
    ELSE
      v_has_access := false;
  END CASE;
  
  RETURN v_has_access;
END;
$$;

