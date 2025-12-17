-- =============================================================================
-- ADIM 7: QURBAN_DONATIONS VE DISTRIBUTION_RECORDS
-- =============================================================================

-- QURBAN_DONATIONS tablosu - çoklu politikaları temizle
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.qurban_donations;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.qurban_donations;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.qurban_donations;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.qurban_donations;
DROP POLICY IF EXISTS "Users can view own facility donations" ON public.qurban_donations;
DROP POLICY IF EXISTS "Users can create donations" ON public.qurban_donations;
DROP POLICY IF EXISTS "Users can update donations" ON public.qurban_donations;
DROP POLICY IF EXISTS "Users can delete donations" ON public.qurban_donations;

CREATE POLICY "qurban_donations_select_auth" ON public.qurban_donations 
  FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "qurban_donations_insert_auth" ON public.qurban_donations 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "qurban_donations_update_auth" ON public.qurban_donations 
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "qurban_donations_delete_auth" ON public.qurban_donations 
  FOR DELETE USING ((select auth.role()) = 'authenticated');

-- DISTRIBUTION_RECORDS tablosu - çoklu politikaları temizle
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.distribution_records;
DROP POLICY IF EXISTS "Users can view own facility distributions" ON public.distribution_records;
DROP POLICY IF EXISTS "Users can create distributions" ON public.distribution_records;
DROP POLICY IF EXISTS "Users can update distributions" ON public.distribution_records;
DROP POLICY IF EXISTS "Users can delete distributions" ON public.distribution_records;

CREATE POLICY "distribution_records_select_auth" ON public.distribution_records 
  FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "distribution_records_insert_auth" ON public.distribution_records 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "distribution_records_update_auth" ON public.distribution_records 
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "distribution_records_delete_auth" ON public.distribution_records 
  FOR DELETE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'Adım 7 tamamlandı: qurban_donations, distribution_records düzeltildi' as status;
