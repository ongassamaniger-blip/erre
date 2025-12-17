-- =============================================================================
-- ADIM 10: TÜM seed_default_departments VERSİYONLARINI DÜZELT
-- =============================================================================

-- Önce tüm versiyonları bul
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'seed_default_departments';

-- Parametreli versiyonu da düzelt (facility_id uuid olanı)
ALTER FUNCTION public.seed_default_departments(uuid) SET search_path = public;

-- =============================================================================
SELECT 'Tüm versiyonlar düzeltildi!' as status;
