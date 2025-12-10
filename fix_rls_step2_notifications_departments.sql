-- =============================================================================
-- ADIM 2: NOTIFICATIONS VE DEPARTMENTS RLS DÜZELTMELERI
-- =============================================================================

-- NOTIFICATIONS tablosu
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications 
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications 
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- DEPARTMENTS tablosu - çoklu politikaları temizle
DROP POLICY IF EXISTS "Authenticated users can select departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can update departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can insert departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can delete departments" ON public.departments;
DROP POLICY IF EXISTS "Users can view departments" ON public.departments;

-- Tek politikalar
CREATE POLICY "departments_select_all" ON public.departments 
  FOR SELECT USING (true);

CREATE POLICY "departments_insert_auth" ON public.departments 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "departments_update_auth" ON public.departments 
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "departments_delete_auth" ON public.departments 
  FOR DELETE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'Adım 2 tamamlandı: notifications, departments düzeltildi' as status;
