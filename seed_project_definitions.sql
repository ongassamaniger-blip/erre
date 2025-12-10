-- ==============================================================================
-- Seed Project Definitions (Types & Categories)
-- ==============================================================================

-- 1. Update RLS Policies to allow Super Admin access and Global Read
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Read access for users in same facility" ON public.project_categories;
DROP POLICY IF EXISTS "Insert access for users in same facility" ON public.project_categories;
DROP POLICY IF EXISTS "Read access for users in same facility" ON public.project_types;
DROP POLICY IF EXISTS "Insert access for users in same facility" ON public.project_types;

-- Project Categories Policies
CREATE POLICY "Read access for project_categories" ON public.project_categories
    FOR SELECT USING (
        facility_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.facility_users 
            WHERE user_id = auth.uid() AND facility_id = project_categories.facility_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

CREATE POLICY "Insert access for project_categories" ON public.project_categories
    FOR INSERT WITH CHECK (
        (
            facility_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.facility_users 
                WHERE user_id = auth.uid() AND facility_id = project_categories.facility_id
            )
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

-- Project Types Policies
CREATE POLICY "Read access for project_types" ON public.project_types
    FOR SELECT USING (
        facility_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.facility_users 
            WHERE user_id = auth.uid() AND facility_id = project_types.facility_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

CREATE POLICY "Insert access for project_types" ON public.project_types
    FOR INSERT WITH CHECK (
        (
            facility_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.facility_users 
                WHERE user_id = auth.uid() AND facility_id = project_types.facility_id
            )
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

-- 2. Seed Data
-- Global Project Types
INSERT INTO public.project_types (name, description, facility_id) VALUES
('İnsani Yardım', 'Acil durum ve temel ihtiyaç yardımları', NULL),
('Eğitim', 'Okul inşası, burslar ve eğitim materyalleri', NULL),
('Sağlık', 'Hastane inşası, ilaç yardımı ve sağlık taramaları', NULL),
('Su Kuyusu', 'Temiz su erişimi sağlamak için kuyu açma projeleri', NULL),
('Yetim Sponsorluğu', 'Yetimlerin bakımı ve ihtiyaçlarının karşılanması', NULL),
('Kurban Organizasyonu', 'Kurban bağışlarının toplanması ve dağıtımı', NULL),
('Ramazan Etkinlikleri', 'İftar sofraları ve gıda kolisi dağıtımı', NULL),
('Acil Durum Müdahalesi', 'Doğal afet ve kriz bölgelerine acil yardım', NULL),
('Kalkınma Projeleri', 'Sürdürülebilir kalkınma ve meslek edindirme', NULL),
('İnşaat ve Altyapı', 'Cami, okul, yetimhane vb. yapıların inşası', NULL),
('Kış Yardımları', 'Yakacak, giyecek ve battaniye yardımları', NULL),
('Gıda Bankacılığı', 'Düzenli gıda yardımı organizasyonları', NULL)
ON CONFLICT DO NOTHING;

-- Global Project Categories
INSERT INTO public.project_categories (name, description, facility_id) VALUES
('Acil Yardım', 'Afet ve kriz bölgelerine yönelik acil müdahaleler', NULL),
('Sürdürülebilir Kalkınma', 'Uzun vadeli etki yaratan kalkınma projeleri', NULL),
('Sosyal Hizmetler', 'Dezavantajlı gruplara yönelik sosyal destekler', NULL),
('Eğitim Destek', 'Eğitim kalitesini artırmaya yönelik çalışmalar', NULL),
('Sağlık Hizmetleri', 'Sağlık erişimini kolaylaştıran projeler', NULL),
('Su ve Sanitasyon', 'Temiz su ve hijyen koşullarının iyileştirilmesi', NULL),
('Barınma', 'Konut ve barınma ihtiyacına yönelik projeler', NULL),
('Gıda Güvenliği', 'Açlıkla mücadele ve gıda temini', NULL),
('Kültürel Faaliyetler', 'Kültürel değerlerin korunması ve tanıtılması', NULL),
('Çevre Koruma', 'Doğal kaynakların korunması ve çevre bilinci', NULL),
('Gelir Getirici Projeler', 'Ailelerin ekonomik bağımsızlığını sağlayan projeler', NULL)
ON CONFLICT DO NOTHING;

-- 3. Add Unique Indexes to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_types_global_unique 
ON public.project_types(name) 
WHERE facility_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_categories_global_unique 
ON public.project_categories(name) 
WHERE facility_id IS NULL;
