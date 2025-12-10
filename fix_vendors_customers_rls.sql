-- =============================================================================
-- VENDORS_CUSTOMERS RLS POLİTİKASI DÜZELTMESİ
-- =============================================================================

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "vendors_customers_all" ON public.vendors_customers;
DROP POLICY IF EXISTS "vendors_customers_select" ON public.vendors_customers;
DROP POLICY IF EXISTS "vendors_customers_insert" ON public.vendors_customers;
DROP POLICY IF EXISTS "vendors_customers_update" ON public.vendors_customers;
DROP POLICY IF EXISTS "vendors_customers_delete" ON public.vendors_customers;

-- RLS aktif olduğundan emin ol
ALTER TABLE public.vendors_customers ENABLE ROW LEVEL SECURITY;

-- Yeni politikalar oluştur - authenticated kullanıcılar tüm işlemleri yapabilir
CREATE POLICY "vendors_customers_select" ON public.vendors_customers 
    FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "vendors_customers_insert" ON public.vendors_customers 
    FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "vendors_customers_update" ON public.vendors_customers 
    FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "vendors_customers_delete" ON public.vendors_customers 
    FOR DELETE USING ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'vendors_customers RLS politikaları güncellendi!' as status;
