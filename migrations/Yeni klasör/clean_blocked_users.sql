-- CLEAN BLOCKED USERS
-- This script cleans dependencies for specific users so they can be deleted.

DO $$
DECLARE
  -- List of emails to clean
  v_emails TEXT[] := ARRAY['erpsistemim@outlook.com', 'aasdasd@hotmail.com'];
  v_email TEXT;
  v_user_id UUID;
BEGIN
  FOREACH v_email IN ARRAY v_emails
  LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
      RAISE NOTICE '--------------------------------------------------';
      RAISE NOTICE 'Cleaning data for user: % (ID: %)', v_email, v_user_id;

      -- 1. Storage Objects
      BEGIN
        DELETE FROM storage.objects WHERE owner = v_user_id;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping storage.objects'; END;

      -- 2. Approval Steps
      BEGIN
        DELETE FROM public.approval_steps WHERE approver_id = v_user_id;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping approval_steps'; END;

      -- 3. Approval Requests
      BEGIN
        DELETE FROM public.approval_requests WHERE requester_id = v_user_id OR approver_id = v_user_id;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping approval_requests'; END;

      -- 4. Activity Logs
      BEGIN
        DELETE FROM public.activity_logs WHERE user_id = v_user_id;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping activity_logs'; END;

      -- 5. Departments
      BEGIN
        UPDATE public.departments SET manager_id = NULL WHERE manager_id = v_user_id;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping departments'; END;

      -- 6. Project Documents
      BEGIN
        UPDATE public.project_documents SET uploaded_by = NULL WHERE uploaded_by = v_user_id;
        DELETE FROM public.project_documents WHERE uploaded_by = v_user_id;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping project_documents'; END;

      -- 7. Project Activities
      BEGIN
        DELETE FROM public.project_activities WHERE user_id = v_user_id;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping project_activities'; END;

      -- 8. Transactions
      BEGIN
        UPDATE public.transactions SET created_by = NULL WHERE created_by = v_user_id;
        UPDATE public.transactions SET approved_by = NULL WHERE approved_by = v_user_id;
        DELETE FROM public.transactions WHERE created_by = v_user_id OR approved_by = v_user_id;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping transactions'; END;

      -- 9. Budget Transfers
      BEGIN
        UPDATE public.budget_transfers SET created_by = NULL WHERE created_by = v_user_id;
        UPDATE public.budget_transfers SET approved_by = NULL WHERE approved_by = v_user_id;
        -- Handle rejected_by
        BEGIN
            UPDATE public.budget_transfers SET rejected_by = NULL WHERE rejected_by = v_user_id;
        EXCEPTION WHEN OTHERS THEN NULL; END;
        
        DELETE FROM public.budget_transfers WHERE created_by = v_user_id OR approved_by = v_user_id;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping budget_transfers'; END;

      -- 10. Leave Requests
      BEGIN
        UPDATE public.leave_requests SET approver_id = NULL WHERE approver_id = v_user_id;
        DELETE FROM public.leave_requests WHERE approver_id = v_user_id;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping leave_requests'; END;

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
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipping profiles'; END;
      
      RAISE NOTICE 'Cleanup finished for %', v_email;
    ELSE
      RAISE NOTICE 'User % not found, skipping.', v_email;
    END IF;
  END LOOP;
END $$;
