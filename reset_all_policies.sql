-- CHECK PROFILE AND RESET POLICIES

-- 1. Check if profile exists
DO $$
DECLARE
  v_user_id UUID;
  v_profile_exists BOOLEAN;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'erpsistemim@outlook.com';
  
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;
  
  IF v_profile_exists THEN
    RAISE NOTICE 'Profile EXISTS for user %', v_user_id;
  ELSE
    RAISE NOTICE 'Profile DOES NOT EXIST for user %. Attempting to create it...', v_user_id;
    
    -- Emergency creation if missing
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (v_user_id, 'erpsistemim@outlook.com', 'Kullanıcı', 'Super Admin');
  END IF;
END $$;

-- 2. NUKE AND REBUILD POLICIES (Clean Slate)
-- Drop all policies to remove duplicates and recursion
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all facilities" ON public.facilities;
DROP POLICY IF EXISTS "Users can view accessible facilities" ON public.facilities;
DROP POLICY IF EXISTS "Users can view own facility access" ON public.facility_users;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE, NON-RECURSIVE policies

-- Profiles: Allow ALL reads (simplest way to fix login)
CREATE POLICY "Allow all reads for profiles" ON public.profiles
  FOR SELECT USING (true);

-- Profiles: Allow update own
CREATE POLICY "Allow update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Facilities: Allow all reads (temporary fix to ensure data loads)
CREATE POLICY "Allow all reads for facilities" ON public.facilities
  FOR SELECT USING (true);

-- Facility Users: Allow all reads (temporary fix)
CREATE POLICY "Allow all reads for facility_users" ON public.facility_users
  FOR SELECT USING (true);

-- Verify
SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('profiles', 'facilities', 'facility_users');
