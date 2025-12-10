-- ==============================================================================
-- Seed Data for HR Module
-- ==============================================================================

-- 1. Insert Global Job Titles (facility_id IS NULL)
-- These will be visible to all facilities
INSERT INTO public.job_titles (title, facility_id) VALUES
('Genel Müdür', NULL),
('İnsan Kaynakları Müdürü', NULL),
('Finans Müdürü', NULL),
('Proje Yöneticisi', NULL),
('Saha Koordinatörü', NULL),
('Muhasebe Uzmanı', NULL),
('İdari İşler Sorumlusu', NULL),
('Yazılım Geliştirici', NULL),
('Veri Analisti', NULL),
('İletişim Uzmanı', NULL),
('Satın Alma Sorumlusu', NULL),
('Lojistik Sorumlusu', NULL),
('Gönüllü Koordinatörü', NULL),
('Sosyal Medya Uzmanı', NULL),
('Bağış İlişkileri Sorumlusu', NULL),
('Eğitim Koordinatörü', NULL),
('Bölge Sorumlusu', NULL),
('Ofis Asistanı', NULL),
('Şoför', NULL),
('Güvenlik Görevlisi', NULL),
('Temizlik Personeli', NULL)
ON CONFLICT DO NOTHING;

-- 2. Function to Seed Default Departments for a Facility
-- Usage: SELECT seed_default_departments('facility_uuid');
CREATE OR REPLACE FUNCTION seed_default_departments(target_facility_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.departments (name, code, facility_id, description) VALUES
    ('Yönetim', 'YNT', target_facility_id, 'Genel Yönetim ve İdari İşler'),
    ('İnsan Kaynakları', 'IK', target_facility_id, 'Personel Yönetimi ve İşe Alım'),
    ('Finans ve Muhasebe', 'FIN', target_facility_id, 'Mali İşler ve Bütçe Yönetimi'),
    ('Projeler', 'PRJ', target_facility_id, 'Proje Planlama ve Yürütme'),
    ('Satın Alma ve Lojistik', 'SAT', target_facility_id, 'Tedarik Zinciri ve Lojistik'),
    ('Kurumsal İletişim', 'ILT', target_facility_id, 'Halkla İlişkiler ve Medya'),
    ('Bilgi Teknolojileri', 'BT', target_facility_id, 'IT Altyapısı ve Yazılım'),
    ('Kaynak Geliştirme', 'KYN', target_facility_id, 'Bağış ve Fon Yönetimi'),
    ('Hukuk', 'HUK', target_facility_id, 'Hukuki Süreçler'),
    ('Denetim', 'DNT', target_facility_id, 'İç Denetim ve Kontrol')
    ON CONFLICT (code, facility_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 3. Auto-seed for existing facilities (Optional, but helpful)
-- This block loops through all facilities and adds departments if they don't exist
DO $$
DECLARE
    f record;
BEGIN
    FOR f IN SELECT id FROM public.facilities LOOP
        PERFORM seed_default_departments(f.id);
    END LOOP;
END;
$$;
