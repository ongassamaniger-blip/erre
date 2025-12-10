-- CLEAN USER DATA FOR DELETION
-- This script removes all data associated with a user in the public schema.
-- This resolves the "Database error deleting user" caused by foreign key constraints.

DO $$
DECLARE
  v_email TEXT := 'erpsistemim@outlook.com'; -- TARGET EMAIL
  v_user_id UUID;
BEGIN
  -- 1. Find User ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Cleaning data for user: % (ID: %)', v_email, v_user_id;

    -- 2. Delete from dependent tables (Order matters!)
    
    -- HR / Finance Dependencies
    DELETE FROM public.leave_requests WHERE user_id = v_user_id OR approver_id = v_user_id;
    DELETE FROM public.advance_requests WHERE user_id = v_user_id OR approver_id = v_user_id;
    DELETE FROM public.budget_transfers WHERE requester_id = v_user_id OR approver_id = v_user_id;
    
    -- Facility Access
    DELETE FROM public.facility_users WHERE user_id = v_user_id;
    
    -- Notifications
    DELETE FROM public.notifications WHERE user_id = v_user_id;
    
    -- Profiles (This is usually the main blocker)
    DELETE FROM public.profiles WHERE id = v_user_id;

    -- 3. Attempt to delete from auth.users
    BEGIN
      DELETE FROM auth.users WHERE id = v_user_id;
      RAISE NOTICE 'User deleted from auth.users successfully.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not delete from auth.users directly (Permissions). You can now delete it from the Dashboard.';
    END;

  ELSE
    RAISE NOTICE 'User % not found in auth.users.', v_email;
  END IF;
END $$;
