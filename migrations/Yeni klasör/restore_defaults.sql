-- RESTORE DEFAULT POLICIES
-- This script removes the problematic recursive policies and restores simple, safe defaults.

BEGIN;

-- 1. Drop the recursive policy causing 500 errors
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;

-- 2. Drop other potential conflicting policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Ensure the basic "View Own Profile" policy exists (This is all you need to login)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 4. Ensure Update Own Profile exists
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Drop the custom function if it exists to clean up
DROP FUNCTION IF EXISTS public.is_super_admin();

COMMIT;

-- RAISE NOTICE 'System restored to safe defaults.';
