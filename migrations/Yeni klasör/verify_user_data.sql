-- VERIFY USER DATA
-- Replace 'erpsistemim@outlook.com' with the email you are trying to login with if different.

DO $$
DECLARE
  v_email TEXT := 'erpsistemim@outlook.com';
  v_user_id UUID;
  v_profile_exists BOOLEAN;
  v_facility_count INTEGER;
BEGIN
  -- 1. Check Auth User
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ User % NOT FOUND in auth.users', v_email;
    RETURN;
  ELSE
    RAISE NOTICE '✅ User % found in auth.users (ID: %)', v_email, v_user_id;
  END IF;

  -- 2. Check Profile
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;
  
  IF v_profile_exists THEN
    RAISE NOTICE '✅ Profile found for user';
  ELSE
    RAISE NOTICE '❌ Profile NOT FOUND for user';
  END IF;

  -- 3. Check Facility Access
  SELECT count(*) INTO v_facility_count FROM public.facility_users WHERE user_id = v_user_id;
  
  IF v_facility_count > 0 THEN
    RAISE NOTICE '✅ User has access to % facilities', v_facility_count;
  ELSE
    RAISE NOTICE '❌ User has NO facility access';
  END IF;

  -- 4. Check RLS (Simulated)
  -- This is tricky to test from a script running as superuser, but we can check policies
  RAISE NOTICE 'Checking Policies...';
END $$;

SELECT * FROM pg_policies WHERE tablename = 'profiles';
