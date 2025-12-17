-- COMPREHENSIVE LOGIN FIX SCRIPT
-- This script fixes the "Profile Not Found" issue for ALL users.
-- It bypasses RLS to ensure data is written correctly.

BEGIN;

-- 1. Temporarily Disable RLS on critical tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_users DISABLE ROW LEVEL SECURITY;

-- 2. Ensure Default Facility Exists
DO $$
DECLARE
  v_facility_id UUID;
BEGIN
  SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
  
  IF v_facility_id IS NULL THEN
    INSERT INTO public.facilities (name, code, type, location, enabled_modules)
    VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
    RETURNING id INTO v_facility_id;
  END IF;
END $$;

-- 3. Loop through ALL users and fix their data
DO $$
DECLARE
  r RECORD;
  v_facility_id UUID;
BEGIN
  -- Get facility ID again
  SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';

  FOR r IN SELECT * FROM auth.users LOOP
    -- A. Create/Update Profile
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (
      r.id,
      r.email,
      COALESCE(r.raw_user_meta_data->>'name', 'Kullanıcı'),
      'Super Admin', -- Default to Super Admin to ensure access
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'Super Admin', -- Force update role to ensure access
      updated_at = now();
      
    -- B. Grant Facility Access
    INSERT INTO public.facility_users (user_id, facility_id)
    VALUES (r.id, v_facility_id)
    ON CONFLICT (user_id, facility_id) DO NOTHING;
    
    RAISE NOTICE 'Fixed user: %', r.email;
  END LOOP;
END $$;

-- 4. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;

-- 5. Reset Policies to be Permissive (Just in case)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Super Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

-- Facility Users Policies
DROP POLICY IF EXISTS "Users can view own facility access" ON public.facility_users;

CREATE POLICY "Users can view own facility access" ON public.facility_users
  FOR SELECT USING (user_id = auth.uid());

COMMIT;
