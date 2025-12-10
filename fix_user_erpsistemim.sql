-- FIX LOGIN FOR erpsistemim@outlook.com
-- This script:
-- 1. Fixes the "500 Recursion Error" by updating the admin check function.
-- 2. Ensures a profile exists for 'erpsistemim@outlook.com'.
-- 3. Grants facility access to this user.

BEGIN;

-- 1. FIX RECURSION (The 500 Error)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Security Definer allows this to run without triggering RLS loops
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Super Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply the policy safely
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
CREATE POLICY "Super Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_super_admin());

-- 2. FIX USER DATA (erpsistemim@outlook.com)
DO $$
DECLARE
  v_user_id UUID;
  v_facility_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'erpsistemim@outlook.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Create/Update Profile
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (
      v_user_id,
      'erpsistemim@outlook.com',
      'Admin User',
      'Super Admin',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'Super Admin',
      updated_at = now();

    -- Ensure Facility Exists (Genel Merkez)
    SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
    IF v_facility_id IS NULL THEN
      INSERT INTO public.facilities (name, code, type, location, enabled_modules)
      VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
      RETURNING id INTO v_facility_id;
    END IF;

    -- Grant Access
    INSERT INTO public.facility_users (user_id, facility_id)
    VALUES (v_user_id, v_facility_id)
    ON CONFLICT (user_id, facility_id) DO NOTHING;
    
    RAISE NOTICE 'User erpsistemim@outlook.com fixed successfully.';
  ELSE
    RAISE NOTICE 'User erpsistemim@outlook.com not found in auth.users. Please sign up first or check the email.';
  END IF;
END $$;

COMMIT;
