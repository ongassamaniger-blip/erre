-- Fix existing user facility access
-- Bu script, yanlışlıkla Genel Merkez erişimi olan kullanıcıları temizler
-- Sadece Super Admin rolündeki kullanıcılar Genel Merkez'de kalmalı

-- 1. Super Admin olmayan kullanıcıların Genel Merkez erişimini kaldır
DELETE FROM public.facility_users
WHERE facility_id = (SELECT id FROM public.facilities WHERE code = 'GM01')
AND user_id IN (
  SELECT id FROM public.profiles 
  WHERE role != 'Super Admin'
);

-- 2. Kontrol: Hangi kullanıcılar hangi tesislere erişiyor?
-- (Bu sorguyu çalıştırarak sonucu kontrol edebilirsiniz)
SELECT 
  p.email,
  p.name,
  p.role,
  f.code as facility_code,
  f.name as facility_name
FROM public.facility_users fu
JOIN public.profiles p ON p.id = fu.user_id
JOIN public.facilities f ON f.id = fu.facility_id
ORDER BY p.email, f.code;

-- 3. Eğer belirli bir kullanıcının erişimlerini temizlemek isterseniz:
-- DELETE FROM public.facility_users
-- WHERE user_id = 'USER_ID_HERE'
-- AND facility_id = (SELECT id FROM public.facilities WHERE code = 'GM01');

