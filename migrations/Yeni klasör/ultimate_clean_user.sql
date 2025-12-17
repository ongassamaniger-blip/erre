-- ULTIMATE CLEAN USER DATA
-- This script attempts to remove ALL references to a user to allow deletion.
-- It handles missing tables and columns gracefully.

DO $$
DECLARE
  v_email TEXT := 'erpsistemim@outlook.com'; -- TARGET EMAIL
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Cleaning data for user: % (ID: %)', v_email, v_user_id;

    -- 1. Approval Steps
    BEGIN
      DELETE FROM public.approval_steps WHERE approver_id = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping approval_steps'; END;

    -- 2. Approval Requests
    BEGIN
      DELETE FROM public.approval_requests WHERE requester_id = v_user_id OR approver_id = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping approval_requests'; END;

    -- 3. Activity Logs
    BEGIN
      DELETE FROM public.activity_logs WHERE user_id = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping activity_logs'; END;

    -- 4. Departments (Set Manager to NULL)
    BEGIN
      UPDATE public.departments SET manager_id = NULL WHERE manager_id = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping departments'; END;

    -- 5. Project Documents
    BEGIN
      UPDATE public.project_documents SET uploaded_by = NULL WHERE uploaded_by = v_user_id;
      DELETE FROM public.project_documents WHERE uploaded_by = v_user_id; -- If NOT NULL constraint exists
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping project_documents'; END;

    -- 6. Project Activities
    BEGIN
      DELETE FROM public.project_activities WHERE user_id = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping project_activities'; END;

    -- 7. Transactions
    BEGIN
      UPDATE public.transactions SET created_by = NULL WHERE created_by = v_user_id;
      UPDATE public.transactions SET approved_by = NULL WHERE approved_by = v_user_id;
      DELETE FROM public.transactions WHERE created_by = v_user_id OR approved_by = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping transactions'; END;

    -- 8. Budget Transfers
    BEGIN
      UPDATE public.budget_transfers SET created_by = NULL WHERE created_by = v_user_id;
      UPDATE public.budget_transfers SET approved_by = NULL WHERE approved_by = v_user_id;
      DELETE FROM public.budget_transfers WHERE created_by = v_user_id OR approved_by = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping budget_transfers'; END;

    -- 9. Leave Requests
    BEGIN
      UPDATE public.leave_requests SET approver_id = NULL WHERE approver_id = v_user_id;
      DELETE FROM public.leave_requests WHERE approver_id = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping leave_requests'; END;

    -- 10. Advance Requests (If exists)
    BEGIN
      EXECUTE 'UPDATE public.advance_requests SET approver_id = NULL WHERE approver_id = $1' USING v_user_id;
      EXECUTE 'DELETE FROM public.advance_requests WHERE approver_id = $1' USING v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping advance_requests'; END;

    -- 11. Notifications
    BEGIN
      DELETE FROM public.notifications WHERE user_id = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping notifications'; END;

    -- 12. Facility Users
    BEGIN
      DELETE FROM public.facility_users WHERE user_id = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping facility_users'; END;

    -- 13. Profiles
    BEGIN
      DELETE FROM public.profiles WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping profiles deletion (Error: %)', SQLERRM; END;

    -- 14. Storage Objects (Files uploaded by user)
    BEGIN
      DELETE FROM storage.objects WHERE owner = v_user_id;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping storage.objects (Permissions or not found)'; END;

    -- 15. Auth User
    BEGIN
      DELETE FROM auth.users WHERE id = v_user_id;
      RAISE NOTICE 'User deleted from auth.users successfully.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not delete from auth.users directly. Please delete from Dashboard.';
    END;

  ELSE 
    RAISE NOTICE 'User % not found in auth.users.', v_email;
  END IF;
END $$;
