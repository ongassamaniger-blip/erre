-- FIX SYSTEM AUTOMATION & PERMISSIONS (PERMANENT FIX)

-- 1. Drop existing trigger to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create ROBUST Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_facility_id UUID;
BEGIN
  -- Check if this is the first user in the profiles table
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO v_is_first_user;

  -- Create Profile (Handle potential conflicts gracefully)
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Kullanıcı'),
    CASE WHEN v_is_first_user THEN 'Super Admin' ELSE 'User' END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role, -- Update role if exists
    updated_at = NOW();

  -- Ensure Default Facility Exists (Genel Merkez)
  SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
  
  IF v_facility_id IS NULL THEN
    INSERT INTO public.facilities (name, code, type, location, enabled_modules)
    VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
    RETURNING id INTO v_facility_id;
  END IF;

  -- Grant Facility Access
  INSERT INTO public.facility_users (user_id, facility_id)
  VALUES (NEW.id, v_facility_id)
  ON CONFLICT (user_id, facility_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-bind Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. FIX PERMISSIONS (RLS) PERMANENTLY
-- Ensure tables are secure but readable by authenticated users

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all reads for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Allow all reads for profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Facilities
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all reads for facilities" ON public.facilities;
CREATE POLICY "Allow all reads for facilities" ON public.facilities FOR SELECT USING (true);

-- Facility Users
ALTER TABLE public.facility_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all reads for facility_users" ON public.facility_users;
CREATE POLICY "Allow all reads for facility_users" ON public.facility_users FOR SELECT USING (true);

-- 5. Force Fix Current User (Just in case)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'erpsistemim@outlook.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Ensure profile exists
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (v_user_id, 'erpsistemim@outlook.com', 'Kullanıcı', 'Super Admin')
    ON CONFLICT (id) DO UPDATE SET role = 'Super Admin';
    
    -- Ensure facility access
    INSERT INTO public.facility_users (user_id, facility_id)
    SELECT v_user_id, id FROM public.facilities WHERE code = 'GM01'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
