-- EMERGENCY UNLOCK SCRIPT
-- This script will:
-- 1. Temporarily disable RLS on profiles to ensure we can write to it.
-- 2. Re-create the admin profile if missing.
-- 3. Ensure the 'Genel Merkez' facility exists.
-- 4. Grant access to the admin user.
-- 5. Re-enable RLS with correct policies.

-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Disable RLS on profiles (temporarily)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Fix Profile
DO $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT;
BEGIN
  -- Get email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  
  IF v_email IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (
      v_user_id,
      v_email,
      'Admin User',
      'Super Admin',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'Super Admin';
      
    RAISE NOTICE 'Profile fixed for user: %', v_email;
  ELSE
    RAISE NOTICE 'No auth user found for current session (auth.uid() is null). Make sure you are running this in SQL Editor while authenticated, or manually replace auth.uid() with your UUID.';
  END IF;
END $$;

-- 3. Fix Facility (Genel Merkez)
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

  -- 4. Grant Access
  INSERT INTO public.facility_users (user_id, facility_id)
  VALUES (auth.uid(), v_facility_id)
  ON CONFLICT (user_id, facility_id) DO NOTHING;
  
  RAISE NOTICE 'Facility access granted.';
END $$;

-- 5. Re-enable and Fix RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;

-- Create permissive policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
  
-- Allow Super Admins to see all profiles (needed for user management)
CREATE POLICY "Super Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

COMMIT;

-- RAISE NOTICE 'Emergency unlock completed successfully.';
