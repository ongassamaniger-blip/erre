-- Targeted script to fix ONLY Distribution Records and Photo Uploads

-- 1. STORAGE: qurban-photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('qurban-photos', 'qurban-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Drop existing to ensure clean slate for this bucket)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'qurban-photos' );

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'qurban-photos' );

DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
CREATE POLICY "Authenticated users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'qurban-photos' AND auth.uid() = owner );


-- 2. TABLE: distribution_records
CREATE TABLE IF NOT EXISTS public.distribution_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure all columns exist (Idempotent)
DO $$
BEGIN
  -- Common fields
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN date date; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN facility_id uuid; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN campaign_id uuid; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN campaign_name text; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN distribution_type text; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN status text DEFAULT 'pending'; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN notes text; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN photo text; EXCEPTION WHEN duplicate_column THEN END;
  
  -- Bulk specific
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN region text; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN package_count integer; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN total_weight numeric; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN average_weight_per_package numeric; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN distribution_list text; EXCEPTION WHEN duplicate_column THEN END;
  
  -- Individual specific
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN package_number text; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN recipient_name text; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN recipient_code text; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN weight numeric; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN received_by text; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.distribution_records ADD COLUMN signature text; EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 3. PERMISSIONS: distribution_records
ALTER TABLE public.distribution_records ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for now to ensure it works (Authenticated users can do everything)
-- We can refine this later if needed, but this guarantees functionality.

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.distribution_records;
CREATE POLICY "Enable all access for authenticated users" ON public.distribution_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
