-- FINAL RLS FIX
-- This script fixes RLS for ALL tables involved in login: profiles, facilities, and facility_users.
-- It ensures you can read your own profile, your facility access, and the facility details.

BEGIN;

-- 1. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. FACILITY_USERS
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own facility access" ON public.facility_users;

CREATE POLICY "Users can view own facility access" ON public.facility_users
  FOR SELECT USING (user_id = auth.uid());

-- 3. FACILITIES
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view facilities they belong to" ON public.facilities;

-- Allow users to see facilities they are assigned to
CREATE POLICY "Users can view facilities they belong to" ON public.facilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.facility_users
      WHERE facility_users.facility_id = facilities.id
      AND facility_users.user_id = auth.uid()
    )
  );

COMMIT;

-- RAISE NOTICE 'All RLS policies fixed.';
