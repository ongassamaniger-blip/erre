-- Super Admin Kullanıcısı Oluşturma Scripti
-- Email: erpsistemim@outlook.com
-- Şifre: deneme123.
-- Rol: Super Admin

-- NOT: Bu script Supabase Admin API kullanmadan direkt auth.users'a insert yapamaz
-- Bu yüzden iki yöntem sunuyoruz:

-- =============================================================================
-- YÖNTEM 1: Supabase Dashboard'dan Manuel Oluşturma (ÖNERİLEN)
-- =============================================================================
-- 1. Supabase Dashboard → Authentication → Users → Add User
-- 2. Email: erpsistemim@outlook.com
-- 3. Password: deneme123.
-- 4. Auto Confirm: ✅ (işaretle)
-- 5. User Metadata: {"name": "ERP Sistemim"}
-- 6. Create User
-- 7. Sonra aşağıdaki SQL'i çalıştırın (profile'ı güncellemek için)

-- =============================================================================
-- YÖNTEM 2: Mevcut Kullanıcıyı Super Admin Yapma
-- =============================================================================
-- Eğer kullanıcı zaten varsa, sadece rolünü güncelle:

UPDATE public.profiles
SET 
  role = 'Super Admin',
  name = 'ERP Sistemim',
  status = 'active',
  updated_at = NOW()
WHERE email = 'erpsistemim@outlook.com';

-- Genel Merkez erişimini kontrol et ve ekle
DO $$
DECLARE
  v_user_id UUID;
  v_facility_id UUID;
BEGIN
  -- Kullanıcı ID'sini bul
  SELECT id INTO v_user_id FROM public.profiles WHERE email = 'erpsistemim@outlook.com';
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Kullanıcı bulunamadı. Lütfen önce Supabase Dashboard''dan kullanıcı oluşturun.';
    RETURN;
  END IF;
  
  -- Genel Merkez ID'sini bul
  SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
  
  IF v_facility_id IS NULL THEN
    -- Genel Merkez yoksa oluştur
    INSERT INTO public.facilities (name, code, type, location, enabled_modules)
    VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
    RETURNING id INTO v_facility_id;
  END IF;
  
  -- Genel Merkez erişimini ekle
  INSERT INTO public.facility_users (user_id, facility_id)
  VALUES (v_user_id, v_facility_id)
  ON CONFLICT (user_id, facility_id) DO NOTHING;
  
  RAISE NOTICE 'Super Admin kullanıcısı başarıyla oluşturuldu/güncellendi: erpsistemim@outlook.com';
END $$;

-- =============================================================================
-- KONTROL: Kullanıcının durumunu kontrol et
-- =============================================================================
SELECT 
  p.email,
  p.name,
  p.role,
  p.status,
  f.code as facility_code,
  f.name as facility_name
FROM public.profiles p
LEFT JOIN public.facility_users fu ON fu.user_id = p.id
LEFT JOIN public.facilities f ON f.id = fu.facility_id
WHERE p.email = 'erpsistemim@outlook.com';

