-- Consolidated script to fix ALL Qurban permissions (Storage + Tables + Schema)

-- 1. STORAGE PERMISSIONS
-- Create the storage bucket 'qurban-photos' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('qurban-photos', 'qurban-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for qurban-photos bucket
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

DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;
CREATE POLICY "Authenticated users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'qurban-photos' AND auth.uid() = owner );


-- 2. TABLE SCHEMA (Ensure columns exist)

CREATE TABLE IF NOT EXISTS public.distribution_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns if they don't exist (idempotent)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN date date;
  EXCEPTION WHEN duplicate_column THEN END;
  
  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN facility_id uuid;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN campaign_id uuid;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN campaign_name text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN distribution_type text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN region text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN package_count integer;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN total_weight numeric;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN average_weight_per_package numeric;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN distribution_list text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN package_number text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN recipient_name text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN recipient_code text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN weight numeric;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN status text DEFAULT 'pending';
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN received_by text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN signature text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN photo text;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.distribution_records ADD COLUMN notes text;
  EXCEPTION WHEN duplicate_column THEN END;
END $$;


-- 3. TABLE PERMISSIONS (RLS)

-- Helper function to check facility access (if not exists)
DROP FUNCTION IF EXISTS public.has_facility_access(uuid);
CREATE OR REPLACE FUNCTION public.has_facility_access(facility_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_facilities
    WHERE user_id = auth.uid()
    AND facility_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on tables
ALTER TABLE public.qurban_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_records ENABLE ROW LEVEL SECURITY;

-- Policies for qurban_campaigns
DROP POLICY IF EXISTS "Users can delete campaigns" ON public.qurban_campaigns;
CREATE POLICY "Users can delete campaigns" ON public.qurban_campaigns
  FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Policies for qurban_donations
DROP POLICY IF EXISTS "Users can view own facility donations" ON public.qurban_donations;
CREATE POLICY "Users can view own facility donations" ON public.qurban_donations
  FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));

DROP POLICY IF EXISTS "Users can create donations" ON public.qurban_donations;
CREATE POLICY "Users can create donations" ON public.qurban_donations
  FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));

DROP POLICY IF EXISTS "Users can update donations" ON public.qurban_donations;
CREATE POLICY "Users can update donations" ON public.qurban_donations
  FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));

DROP POLICY IF EXISTS "Users can delete donations" ON public.qurban_donations;
CREATE POLICY "Users can delete donations" ON public.qurban_donations
  FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Policies for qurban_schedules
DROP POLICY IF EXISTS "Users can view own facility schedules" ON public.qurban_schedules;
CREATE POLICY "Users can view own facility schedules" ON public.qurban_schedules
  FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));

DROP POLICY IF EXISTS "Users can create schedules" ON public.qurban_schedules;
CREATE POLICY "Users can create schedules" ON public.qurban_schedules
  FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));

DROP POLICY IF EXISTS "Users can update schedules" ON public.qurban_schedules;
CREATE POLICY "Users can update schedules" ON public.qurban_schedules
  FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));

DROP POLICY IF EXISTS "Users can delete schedules" ON public.qurban_schedules;
CREATE POLICY "Users can delete schedules" ON public.qurban_schedules
  FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Policies for distribution_records
DROP POLICY IF EXISTS "Users can view own facility distributions" ON public.distribution_records;
CREATE POLICY "Users can view own facility distributions" ON public.distribution_records
  FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));

DROP POLICY IF EXISTS "Users can create distributions" ON public.distribution_records;
CREATE POLICY "Users can create distributions" ON public.distribution_records
  FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));

DROP POLICY IF EXISTS "Users can update distributions" ON public.distribution_records;
CREATE POLICY "Users can update distributions" ON public.distribution_records
  FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));

DROP POLICY IF EXISTS "Users can delete distributions" ON public.distribution_records;
CREATE POLICY "Users can delete distributions" ON public.distribution_records
  FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));
