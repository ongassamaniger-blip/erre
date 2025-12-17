-- =============================================================================
-- EMPLOYEES TABLOSUNA EKSİK KOLONLARI EKLE
-- =============================================================================
-- Bu migration, employees tablosundaki eksik alanları ekler

-- Code (Çalışan kodu) alanı ekle
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- Status alanı ekle (aktif, izinli, pasif)
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Position (Pozisyon) alanı ekle
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS position TEXT;

-- Department (Departman adı) alanı ekle
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Nationality (Vatandaşlık) alanı ekle
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'TR';

-- Mevcut verileri düzenle - status kolonu yoksa veya NULL ise 'active' yap
-- is_active kolonu varsa ondan map et, yoksa direkt 'active' yap
DO $$ 
BEGIN
  -- is_active kolonu var mı kontrol et
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'employees' 
    AND column_name = 'is_active'
  ) THEN
    -- is_active kolonu varsa, ondan status'a map et
    UPDATE public.employees 
    SET status = CASE 
        WHEN is_active = true THEN 'active'
        ELSE 'inactive'
    END
    WHERE status IS NULL;
  ELSE
    -- is_active kolonu yoksa, tüm NULL status'ları 'active' yap
    UPDATE public.employees 
    SET status = 'active'
    WHERE status IS NULL;
  END IF;
END $$;

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_employees_code ON public.employees(code);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);

-- =============================================================================
-- AÇIKLAMA
-- =============================================================================
-- Bu migration'ı Supabase SQL Editor'da çalıştırın.
-- Mevcut veriler korunacak ve yeni alanlar mevcut verilere eklenerek güncellenecektir.
