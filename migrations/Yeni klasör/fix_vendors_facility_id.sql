-- =============================================================================
-- ESKİ TEDARİKÇİ/MÜŞTERİ KAYITLARINI GÜNCELLEME
-- Bu script eski vendors_customers kayıtlarını güncel facility_id ile günceller
-- =============================================================================

-- 1. Önce mevcut kayıtları kontrol et
SELECT id, name, type, status, facility_id 
FROM vendors_customers 
ORDER BY name;

-- 2. facility_id'si NULL veya boş olanları ilk facility ile güncelle
-- Önce facility ID'yi al
-- Eğer birden fazla facility varsa, Genel Merkez olanı seç
DO $$
DECLARE
    v_facility_id UUID;
BEGIN
    -- Headquarters facility ID'yi al
    SELECT id INTO v_facility_id 
    FROM facilities 
    WHERE is_headquarters = true 
    LIMIT 1;
    
    -- Eğer headquarters yoksa ilk facility'yi al
    IF v_facility_id IS NULL THEN
        SELECT id INTO v_facility_id 
        FROM facilities 
        LIMIT 1;
    END IF;
    
    -- NULL facility_id olan kayıtları güncelle
    UPDATE vendors_customers 
    SET facility_id = v_facility_id 
    WHERE facility_id IS NULL;
    
    RAISE NOTICE 'Updated vendors_customers with facility_id: %', v_facility_id;
END $$;

-- 3. Sonucu kontrol et
SELECT id, name, type, status, facility_id 
FROM vendors_customers 
ORDER BY name;

SELECT 'Güncelleme tamamlandı!' as durum;
