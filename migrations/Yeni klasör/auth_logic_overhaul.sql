-- AUTH LOGIC OVERHAUL
-- 1. First registered user -> Super Admin
-- 2. Subsequent users -> User (Cannot login)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_facility_id UUID;
BEGIN
  -- Check if this is the first user in the profiles table
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO v_is_first_user;

  -- Create Profile
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Kullanıcı'),
    CASE WHEN v_is_first_user THEN 'Super Admin' ELSE 'User' END, -- Assign role based on order
    NOW(),
    NOW()
  );

  -- Ensure Default Facility Exists
  SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
  IF v_facility_id IS NULL THEN
    INSERT INTO public.facilities (name, code, type, location, enabled_modules)
    VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
    RETURNING id INTO v_facility_id;
  END IF;

  -- Grant Facility Access (Everyone gets access, but only Super Admin can login via App logic)
  INSERT INTO public.facility_users (user_id, facility_id)
  VALUES (NEW.id, v_facility_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
