-- ==============================================================================
-- Setup HR Definitions (Tables, RLS, Seed Data)
-- ==============================================================================

-- 1. Create Tables if not exist
CREATE TABLE IF NOT EXISTS public.job_titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

-- 3. Update RLS Policies (Drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Read access for users in same facility" ON public.job_titles;
DROP POLICY IF EXISTS "Insert access for users in same facility" ON public.job_titles;
DROP POLICY IF EXISTS "Read access for job_titles" ON public.job_titles;
DROP POLICY IF EXISTS "Insert access for job_titles" ON public.job_titles;

-- Read Policy: Users can see global titles (facility_id IS NULL) OR titles for their facility
CREATE POLICY "Read access for job_titles" ON public.job_titles
    FOR SELECT USING (
        facility_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.facility_users 
            WHERE user_id = auth.uid() AND facility_id = job_titles.facility_id
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

-- Insert Policy: Users in the facility OR Super Admins can insert
CREATE POLICY "Insert access for job_titles" ON public.job_titles
    FOR INSERT WITH CHECK (
        (
            facility_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM public.facility_users 
                WHERE user_id = auth.uid() AND facility_id = job_titles.facility_id
            )
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

-- 4. Seed Data
-- Global Job Titles
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

-- Function to Seed Default Departments (if not exists)
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

-- Seed departments for all existing facilities
DO $$
DECLARE
    f record;
BEGIN
    FOR f IN SELECT id FROM public.facilities LOOP
        PERFORM seed_default_departments(f.id);
    END LOOP;
END;
$$;
