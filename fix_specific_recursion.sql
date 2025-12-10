-- TARGETED FIX FOR RECURSION
-- Problem: The policy "Super Admins can view all profiles" calls "is_super_admin()".
-- "is_super_admin()" queries the "profiles" table.
-- Querying "profiles" triggers the policy again.
-- Result: Infinite Loop (500 Error).

BEGIN;

-- 1. Fix the function to bypass RLS (SECURITY DEFINER)
-- This breaks the loop because the function will run with system privileges, ignoring the policy.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Super Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;

-- 3. Re-create the policy (now safe because the function is safe)
CREATE POLICY "Super Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_super_admin());

-- 4. Clean up duplicate/conflicting policies seen in your screenshot
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles; -- This was "true", likely a debug leftover
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles; -- Duplicate

-- 5. Ensure the basic user policy exists
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

COMMIT;

-- RAISE NOTICE 'Recursion fixed logically.';
