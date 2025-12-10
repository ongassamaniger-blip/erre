-- Bu scripti Supabase SQL Editor'da çalıştırın

DO $$
DECLARE
  v_user_id UUID;
  v_facility_id UUID;
BEGIN
  -- 1. Admin kullanıcısının ID'sini bul
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@example.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin kullanıcısı bulunamadı! Lütfen önce Authentication > Users kısmından admin@example.com kullanıcısını oluşturun.';
  END IF;

  -- 2. Profil oluştur veya güncelle
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (
    v_user_id,
    'admin@example.com',
    'Ahmet Yılmaz',
    'Super Admin',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'Super Admin',
    name = 'Ahmet Yılmaz';

  -- 3. Genel Merkez facility ID'sini bul
  SELECT id INTO v_facility_id FROM public.facilities WHERE code = 'GM01';
  
  IF v_facility_id IS NULL THEN
    -- Eğer facility yoksa oluştur (Schema'ya uygun)
    INSERT INTO public.facilities (name, code, type, location, enabled_modules)
    VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban'])
    RETURNING id INTO v_facility_id;
  END IF;

  -- 4. Facility erişimi ver
  -- facility_users tablosunda role kolonu yoksa kaldırın. Schema'da role yoktu sanırım, kontrol edelim.
  -- Schema: user_id, facility_id. Role yok.
  
  INSERT INTO public.facility_users (user_id, facility_id)
  VALUES (v_user_id, v_facility_id)
  ON CONFLICT (user_id, facility_id) DO NOTHING;

  -- Diğer şubelere de erişim ver (Opsiyonel)
  FOR v_facility_id IN SELECT id FROM public.facilities WHERE code != 'GM01' LOOP
    INSERT INTO public.facility_users (user_id, facility_id)
    VALUES (v_user_id, v_facility_id)
    ON CONFLICT (user_id, facility_id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Admin kullanıcısı başarıyla düzeltildi! ID: %', v_user_id;
END $$;
