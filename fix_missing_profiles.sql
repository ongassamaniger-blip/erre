-- Bu scripti Supabase SQL Editor'da çalıştırın
-- Tüm kullanıcılar için eksik profilleri ve tesis erişimlerini oluşturur

DO $$
DECLARE
  r RECORD;
  v_facility_id UUID;
BEGIN
  -- 1. Genel Merkez facility ID'sini bul veya oluştur
  SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
  
  IF v_facility_id IS NULL THEN
    INSERT INTO public.facilities (name, code, type, location, enabled_modules)
    VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
    RETURNING id INTO v_facility_id;
    RAISE NOTICE 'Genel Merkez tesisi oluşturuldu.';
  END IF;

  -- 2. Tüm auth.users kayıtlarını döngüye al
  FOR r IN SELECT * FROM auth.users LOOP
    -- Profil yoksa oluştur
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (
      r.id,
      r.email,
      COALESCE(r.raw_user_meta_data->>'name', 'Kullanıcı'),
      'Super Admin', -- Erişim sorunu yaşamamak için varsayılan olarak Super Admin yapıyoruz
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Facility erişimi yoksa ver
    INSERT INTO public.facility_users (user_id, facility_id)
    VALUES (r.id, v_facility_id)
    ON CONFLICT (user_id, facility_id) DO NOTHING;
    
    RAISE NOTICE 'Kullanıcı işlendi: %', r.email;
  END LOOP;
  
  RAISE NOTICE 'İşlem tamamlandı.';
END $$;
