-- Insert 'Genel Merkez Bütçe Aktarımı' category if it doesn't exist
INSERT INTO categories (name, type, color, facility_id)
SELECT 'Genel Merkez Bütçe Aktarımı', 'income', '#3b82f6', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE name = 'Genel Merkez Bütçe Aktarımı' 
    AND type = 'income'
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload config';
