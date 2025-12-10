-- =============================================================================
-- ADIM 3: BUDGET_TRANSFERS VE CALENDAR_EVENTS RLS DÜZELTMELERI
-- =============================================================================

-- BUDGET_TRANSFERS tablosu - çoklu politikaları temizle
DROP POLICY IF EXISTS "Headquarters can see all transfers" ON public.budget_transfers;
DROP POLICY IF EXISTS "Branches can see their transfers" ON public.budget_transfers;
DROP POLICY IF EXISTS "Headquarters can insert transfers" ON public.budget_transfers;
DROP POLICY IF EXISTS "Headquarters can update transfers" ON public.budget_transfers;

-- Tek politikalar (authenticated kullanıcılar için)
CREATE POLICY "budget_transfers_select_auth" ON public.budget_transfers 
  FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "budget_transfers_insert_auth" ON public.budget_transfers 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "budget_transfers_update_auth" ON public.budget_transfers 
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

-- CALENDAR_EVENTS tablosu
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.calendar_events;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.calendar_events;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.calendar_events;

CREATE POLICY "calendar_events_insert_auth" ON public.calendar_events 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "calendar_events_update_auth" ON public.calendar_events 
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "calendar_events_delete_auth" ON public.calendar_events 
  FOR DELETE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'Adım 3 tamamlandı: budget_transfers, calendar_events düzeltildi' as status;
