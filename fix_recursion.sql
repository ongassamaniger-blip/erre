-- FIX RECURSION IN RLS POLICIES
-- The previous error (500) was caused by an infinite loop in the security policy.
-- The policy checked the 'profiles' table to see if you are an admin, which triggered the policy again, and again...
-- This script fixes it by creating a special function to check admin status safely.

BEGIN;

-- 1. Create a secure function to check admin status (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- This runs with the privileges of the function creator (superuser), bypassing RLS
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Super Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic policy
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;

-- 3. Create the fixed policy using the secure function
CREATE POLICY "Super Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.is_super_admin()
  );

-- 4. Ensure basic self-access policy exists and is correct
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

COMMIT;

-- RAISE NOTICE 'Recursion fixed. You should be able to login now.';
