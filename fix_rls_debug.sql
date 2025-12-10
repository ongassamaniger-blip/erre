-- FIX RLS POLICIES
-- Ensure profiles and facility_users are readable by authenticated users.

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Facility Users
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own facility access" ON public.facility_users;
CREATE POLICY "Users can view own facility access" ON public.facility_users
  FOR SELECT USING (user_id = auth.uid());

-- 3. Facilities
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view accessible facilities" ON public.facilities;
CREATE POLICY "Users can view accessible facilities" ON public.facilities
  FOR SELECT USING (
    id IN (
      SELECT facility_id FROM public.facility_users WHERE user_id = auth.uid()
    )
  );

-- Verify policies exist
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('profiles', 'facility_users', 'facilities');
