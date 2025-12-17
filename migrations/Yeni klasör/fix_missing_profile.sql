-- FIX MISSING PROFILES
-- Finds users in auth.users that don't have a profile in public.profiles and creates them.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    RAISE NOTICE 'Creating missing profile for user: % (%)', r.email, r.id;
    
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (
      r.id,
      r.email,
      COALESCE(r.raw_user_meta_data->>'name', 'Kullanıcı'),
      'Super Admin', -- Force Super Admin for recovery
      NOW(),
      NOW()
    );
    
    -- Also ensure facility access
    INSERT INTO public.facility_users (user_id, facility_id)
    SELECT r.id, id FROM public.facilities WHERE code = 'GM01'
    ON CONFLICT DO NOTHING;
    
  END LOOP;
END $$;

-- Verify final state
SELECT 
  u.email, 
  CASE WHEN p.id IS NOT NULL THEN 'Profile EXISTS' ELSE 'Profile MISSING' END as profile_status,
  p.role,
  f.code as facility
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.facility_users fu ON u.id = fu.user_id
LEFT JOIN public.facilities f ON fu.facility_id = f.id;
