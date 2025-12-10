-- Trigger function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_facility_id UUID;
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Yeni Kullanıcı'),
    'Super Admin', -- Default role as requested
    NOW(),
    NOW()
  );

  -- 2. Ensure Default Facility Exists (Genel Merkez)
  SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
  
  IF v_facility_id IS NULL THEN
    INSERT INTO public.facilities (name, code, type, location, enabled_modules)
    VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
    RETURNING id INTO v_facility_id;
  END IF;

  -- 3. Grant Access to Default Facility
  INSERT INTO public.facility_users (user_id, facility_id)
  VALUES (NEW.id, v_facility_id)
  ON CONFLICT (user_id, facility_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
