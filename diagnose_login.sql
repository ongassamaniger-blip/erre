-- Diagnostic script to check RLS policies and user data
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled on profiles table
SELECT relname as table_name, relrowsecurity as rls_enabled 
FROM pg_class 
WHERE oid = 'public.profiles'::regclass;

-- 2. List all policies on profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 3. Check if the current user can see their own profile
-- Note: This will return 0 if RLS blocks access or if the profile doesn't exist
SELECT count(*) as my_profile_count FROM public.profiles WHERE id = auth.uid();

-- 4. Check if the current user exists in auth.users (should be 1)
SELECT count(*) as my_auth_user_count FROM auth.users WHERE id = auth.uid();

-- 5. Check facility access for current user
SELECT * FROM public.facility_users WHERE user_id = auth.uid();

-- 6. Check if RLS is enabled on facility_users
SELECT relname as table_name, relrowsecurity as rls_enabled 
FROM pg_class 
WHERE oid = 'public.facility_users'::regclass;

-- 7. List policies on facility_users
SELECT * FROM pg_policies WHERE tablename = 'facility_users';
