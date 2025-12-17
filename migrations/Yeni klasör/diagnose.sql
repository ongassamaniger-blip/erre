-- Diagnostic script to check facilities table state

-- 1. Check if RLS is enabled on facilities table (t = true, f = false)
SELECT relname as table_name, relrowsecurity as rls_enabled 
FROM pg_class 
WHERE oid = 'public.facilities'::regclass;

-- 2. Check if 'settings' column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'facilities' AND column_name = 'settings';

-- 3. Check how many facilities are visible to the current user
SELECT count(*) as visible_facility_count FROM facilities;

-- 4. Check available roles (if profiles table exists)
SELECT DISTINCT role FROM profiles;
