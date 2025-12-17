-- DEBUG DELETE USER
-- This script attempts to delete the user WITHOUT hiding errors.
-- Run this and tell me the EXACT error message (e.g., "violates foreign key constraint...").

DO $$
DECLARE
  v_email TEXT := 'erpsistemim@outlook.com';
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Attempting to delete user: %', v_user_id;

    -- Try deleting profile first (this is usually where it gets stuck)
    DELETE FROM public.profiles WHERE id = v_user_id;
    
    -- If profile deletion succeeds, try auth user
    DELETE FROM auth.users WHERE id = v_user_id;
    
  ELSE
    RAISE NOTICE 'User not found!';
  END IF;
END $$;
