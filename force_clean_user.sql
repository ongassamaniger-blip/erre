-- FORCE CLEAN USER DATA (ROBUST)
-- This script specifically targets the foreign key constraints blocking deletion.
-- It handles cases where tables might not exist.

DO $$
DECLARE
  v_email TEXT := 'erpsistemim@outlook.com';
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Cleaning data for user: % (ID: %)', v_email, v_user_id;

    -- 1. Clear references in Leave Requests (Approver)
    BEGIN
      UPDATE public.leave_requests SET approver_id = NULL WHERE approver_id = v_user_id;
      DELETE FROM public.leave_requests WHERE approver_id = v_user_id;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table leave_requests does not exist, skipping.';
    END;
    
    -- Clear references in Advance Requests
    BEGIN
      UPDATE public.advance_requests SET approver_id = NULL WHERE approver_id = v_user_id;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table advance_requests does not exist, skipping.';
    END;
    
    -- Clear references in Budget Transfers
    BEGIN
      UPDATE public.budget_transfers SET approved_by = NULL WHERE approved_by = v_user_id;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Table budget_transfers does not exist, skipping.';
      WHEN undefined_column THEN
        RAISE NOTICE 'Column approved_by does not exist in budget_transfers, skipping.';
    END;

    -- Clear references in Transactions
    BEGIN
      UPDATE public.transactions SET created_by = NULL WHERE created_by = v_user_id;
      UPDATE public.transactions SET approved_by = NULL WHERE approved_by = v_user_id;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Table transactions does not exist, skipping.';
      WHEN undefined_column THEN
        RAISE NOTICE 'Column created_by or approved_by does not exist in transactions, skipping.';
      WHEN not_null_violation THEN
        -- Fallback: Delete transactions if we can't anonymize them
        DELETE FROM public.transactions WHERE created_by = v_user_id OR approved_by = v_user_id;
    END;

    -- Clear references in Project Activities
    BEGIN
      DELETE FROM public.project_activities WHERE user_id = v_user_id;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Table project_activities does not exist, skipping.';
      WHEN undefined_column THEN
        RAISE NOTICE 'Column user_id does not exist in project_activities, skipping.';
    END;

    -- Clear references in Project Documents
    BEGIN
      UPDATE public.project_documents SET uploaded_by = NULL WHERE uploaded_by = v_user_id;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Table project_documents does not exist, skipping.';
      WHEN undefined_column THEN
        RAISE NOTICE 'Column uploaded_by does not exist in project_documents, skipping.';
      WHEN not_null_violation THEN
        DELETE FROM public.project_documents WHERE uploaded_by = v_user_id;
    END;

    -- 2. Facility Access
    DELETE FROM public.facility_users WHERE user_id = v_user_id;
    
    -- 3. Notifications
    DELETE FROM public.notifications WHERE user_id = v_user_id;
    
    -- 4. Profiles
    DELETE FROM public.profiles WHERE id = v_user_id;

    -- 5. Auth User
    BEGIN
      DELETE FROM auth.users WHERE id = v_user_id;
      RAISE NOTICE 'User deleted successfully.';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not delete from auth.users directly. Please delete from Dashboard.';
    END;

  ELSE
    RAISE NOTICE 'User not found.';
  END IF;
END $$;
