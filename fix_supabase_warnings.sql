-- FIX SUPABASE WARNINGS
-- Enable RLS on all tables that might be missing it.

-- 1. Organizations (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations') THEN
    ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
    
    -- Add a basic policy so it's not inaccessible
    DROP POLICY IF EXISTS "Allow all reads for organizations" ON public.organizations;
    CREATE POLICY "Allow all reads for organizations" ON public.organizations
      FOR SELECT USING (true);
      
    RAISE NOTICE 'Enabled RLS on organizations';
  END IF;
END $$;

-- 2. Ensure RLS is enabled on all other core tables (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Verify RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
