-- =============================================================================
-- AUTH DÜZELTME SCRIPTI (Reset Sonrası)
-- Bu scripti Supabase SQL Editor'de çalıştırın
-- =============================================================================

-- 1. Trigger fonksiyonunu yeniden oluştur (daha sağlam versiyon)
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
    'Super Admin',
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS politikalarını düzelt (profiles tablosu için INSERT izni)
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON public.profiles;
CREATE POLICY "Allow trigger to insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT TO service_role WITH CHECK (true);

-- 4. Facilities tablosu için INSERT izni
DROP POLICY IF EXISTS "Allow trigger to insert facilities" ON public.facilities;
CREATE POLICY "Allow trigger to insert facilities" ON public.facilities
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow trigger to select facilities" ON public.facilities;
CREATE POLICY "Allow trigger to select facilities" ON public.facilities
  FOR SELECT USING (true);

-- 5. Facility_users tablosu için INSERT izni
DROP POLICY IF EXISTS "Allow trigger to insert facility_users" ON public.facility_users;
CREATE POLICY "Allow trigger to insert facility_users" ON public.facility_users
  FOR INSERT WITH CHECK (true);

-- 6. Auth şeması için gerekli izinleri kontrol et
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =============================================================================
SELECT '✅ Auth düzeltmeleri tamamlandı!' as durum;
SELECT '🔑 Artık yeni kullanıcı kaydı yapabilirsiniz.' as sonuc;
