-- =============================================================================
-- BÜTÇE AKTARIMLARINDA DÖVİZ KURU KOLONLARI
-- Bu script budget_transfers tablosuna exchange_rate ve amount_in_try kolonlarını ekler
-- =============================================================================

-- 1. Exchange rate kolonunu ekle (döviz kuru)
ALTER TABLE public.budget_transfers 
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15,4) DEFAULT 1;

-- 2. TRY karşılığı kolonunu ekle
ALTER TABLE public.budget_transfers 
ADD COLUMN IF NOT EXISTS amount_in_try DECIMAL(15,2);

-- 3. Mevcut kayıtlar için amount_in_try'ı güncelle (amount değeri olarak)
UPDATE public.budget_transfers 
SET amount_in_try = amount 
WHERE amount_in_try IS NULL;

-- =============================================================================
SELECT '✅ Döviz kuru kolonları eklendi!' as durum;
SELECT 'exchange_rate ve amount_in_try kolonları budget_transfers tablosuna eklendi.' as bilgi;
