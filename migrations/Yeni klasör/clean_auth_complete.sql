-- =============================================================================
-- KAPSAMLI AUTH TEMİZLİK SCRIPTI
-- Tüm auth verilerini ve ilişkili tabloları temizler
-- =============================================================================

-- 1. Auth şemasındaki TÜM verileri temizle
DELETE FROM auth.mfa_factors;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.saml_relay_states;
DELETE FROM auth.sso_domains;
DELETE FROM auth.sso_providers;
DELETE FROM auth.flow_state;
DELETE FROM auth.one_time_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- 2. Public şemasındaki kullanıcı ilişkili tabloları temizle
SET session_replication_role = 'replica';

TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.approval_steps CASCADE;
TRUNCATE TABLE public.approval_requests CASCADE;
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.facility_users CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

SET session_replication_role = 'origin';

-- 3. Trigger'ı yeniden oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_facility_id UUID;
BEGIN
  -- Create Profile
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Yeni Kullanıcı'),
    'Super Admin',
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

  -- Grant Access
  INSERT INTO public.facility_users (user_id, facility_id)
  VALUES (NEW.id, v_facility_id)
  ON CONFLICT (user_id, facility_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
SELECT '✅ Auth şeması tamamen temizlendi!' as durum;
SELECT '🔑 Şimdi yeni kullanıcı kaydı yapabilirsiniz.' as sonuc;
