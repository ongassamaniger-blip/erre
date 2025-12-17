-- =============================================================================
-- İŞLEM SİLME İZNİ - RLS POLİTİKASI
-- Bu SQL Supabase SQL Editor'de çalıştırılmalıdır
-- =============================================================================

-- Mevcut DELETE politikalarını listele
SELECT policyname FROM pg_policies WHERE tablename = 'transactions' AND cmd = 'DELETE';

-- Mevcut DELETE politikasını sil (varsa)
DROP POLICY IF EXISTS "Allow delete transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
DROP POLICY IF EXISTS "delete_transactions" ON transactions;

-- Yeni DELETE politikası oluştur
CREATE POLICY "Allow authenticated users to delete transactions"
ON transactions
FOR DELETE
TO authenticated
USING (true);

-- Politikanın oluşturulduğunu doğrula
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'transactions';

SELECT 'DELETE politikası başarıyla eklendi!' as durum;
