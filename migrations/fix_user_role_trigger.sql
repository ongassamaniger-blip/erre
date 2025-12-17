-- Fix handle_new_user trigger to respect role from user_metadata
-- Edge Function'dan gelen rolü kullanacak şekilde güncellendi

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_facility_id UUID;
  v_user_role TEXT;
BEGIN
  -- Check if this is the first user in the profiles table
  -- NOT: Bu kontrol INSERT'ten ÖNCE yapılmalı, çünkü INSERT henüz gerçekleşmedi
  -- Ancak bu kullanıcı henüz profiles'a eklenmediği için, mevcut kayıt sayısını kontrol ediyoruz
  SELECT COUNT(*) = 0 INTO v_is_first_user FROM public.profiles;

  -- Determine role:
  -- 1. If role is provided in user_metadata, use it
  -- 2. If it's the first user, use 'Super Admin'
  -- 3. Otherwise, use 'User'
  v_user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',  -- Edge Function'dan gelen rol
    CASE WHEN v_is_first_user THEN 'Super Admin' ELSE 'User' END
  );

  -- Create Profile (Handle potential conflicts gracefully)
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Kullanıcı'),
    v_user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, v_user_role),
    name = COALESCE(EXCLUDED.name, NEW.raw_user_meta_data->>'name', 'Kullanıcı'),
    updated_at = NOW();

  -- NOT: Facility erişimi Edge Function tarafından yönetiliyor
  -- Trigger sadece ilk kullanıcı için GM01 ekler (eğer yoksa)
  -- Diğer kullanıcılar için Edge Function facilityIds kullanır
  
  -- Sadece ilk kullanıcı için Genel Merkez'e otomatik erişim ver
  IF v_is_first_user THEN
    -- Ensure Default Facility Exists (Genel Merkez)
    SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
    
    IF v_facility_id IS NULL THEN
      INSERT INTO public.facilities (name, code, type, location, enabled_modules)
      VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
      RETURNING id INTO v_facility_id;
    END IF;

    -- İlk kullanıcıya Genel Merkez erişimi ver
    IF v_facility_id IS NOT NULL THEN
      INSERT INTO public.facility_users (user_id, facility_id)
      VALUES (NEW.id, v_facility_id)
      ON CONFLICT (user_id, facility_id) DO NOTHING;
    END IF;
  END IF;
  
  -- Diğer kullanıcılar için facility erişimi Edge Function tarafından yönetilir
  -- user_metadata'da facilityIds varsa, Edge Function bunları işleyecek

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger zaten var, sadece fonksiyon güncellendi
-- Eğer trigger yoksa, aşağıdaki satırları çalıştırın:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

