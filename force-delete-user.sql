-- Bu scripti Supabase SQL Editor'da çalıştırın

-- 1. Önce profile bağlı verileri temizle (Cascade çalışmazsa diye manuel temizlik)
DELETE FROM public.facility_users 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@example.com');

DELETE FROM public.profiles 
WHERE email = 'admin@example.com';

-- 2. Auth kullanıcısını sil
DELETE FROM auth.users 
WHERE email = 'admin@example.com';

-- Kontrol et
SELECT * FROM auth.users WHERE email = 'admin@example.com';
