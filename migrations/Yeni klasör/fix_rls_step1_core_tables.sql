-- =============================================================================
-- ADIM 1: PROFILES, FACILITIES, FACILITY_USERS RLS DÜZELTMELERI
-- =============================================================================
-- (select auth.uid()) ve (select auth.role()) kullanarak performansı artırır
-- =============================================================================

-- PROFILES tablosu
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING ((select auth.uid()) = id);

-- FACILITIES tablosu - çoklu politikaları temizle
DROP POLICY IF EXISTS "facilities_insert_auth" ON public.facilities;
DROP POLICY IF EXISTS "facilities_select_all" ON public.facilities;
DROP POLICY IF EXISTS "Super Admins can create facilities" ON public.facilities;
DROP POLICY IF EXISTS "Super Admins can update facilities" ON public.facilities;
DROP POLICY IF EXISTS "Super Admins can delete facilities" ON public.facilities;
DROP POLICY IF EXISTS "Users can view facilities they belong to" ON public.facilities;

-- Tek bir SELECT politikası
CREATE POLICY "facilities_select_all" ON public.facilities 
  FOR SELECT USING (true);

-- Tek bir INSERT politikası
CREATE POLICY "facilities_insert_auth" ON public.facilities 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

-- UPDATE ve DELETE için Super Admin kontrolü
CREATE POLICY "facilities_update_auth" ON public.facilities 
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "facilities_delete_auth" ON public.facilities 
  FOR DELETE USING ((select auth.role()) = 'authenticated');

-- FACILITY_USERS tablosu
DROP POLICY IF EXISTS "facility_users_insert_auth" ON public.facility_users;
DROP POLICY IF EXISTS "facility_users_update_auth" ON public.facility_users;

CREATE POLICY "facility_users_insert_auth" ON public.facility_users 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "facility_users_update_auth" ON public.facility_users 
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'Adım 1 tamamlandı: profiles, facilities, facility_users düzeltildi' as status;
