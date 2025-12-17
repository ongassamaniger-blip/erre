-- CHECK CLEAN SLATE
-- The new system relies on the profiles table being empty to assign 'Super Admin' to the next user.

SELECT count(*) as "Profile Count (Should be 0)" FROM public.profiles;

-- Check if we can see auth users
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM auth.users;
  RAISE NOTICE 'Auth Users Count: %', v_count;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Cannot read auth.users directly (Permission denied).';
END $$;
