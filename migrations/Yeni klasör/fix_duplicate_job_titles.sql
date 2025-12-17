-- ==============================================================================
-- Fix Duplicate Job Titles
-- ==============================================================================

-- 1. Delete duplicate records, keeping the oldest one
DELETE FROM public.job_titles
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY title, COALESCE(facility_id, '00000000-0000-0000-0000-000000000000'::uuid) 
                   ORDER BY created_at ASC
               ) as rnum
        FROM public.job_titles
    ) t
    WHERE t.rnum > 1
);

-- 2. Add Unique Indexes to prevent future duplicates

-- For facility-specific titles: Ensure title is unique within a facility
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_titles_facility_unique 
ON public.job_titles(title, facility_id) 
WHERE facility_id IS NOT NULL;

-- For global titles: Ensure title is unique globally (where facility_id is null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_titles_global_unique 
ON public.job_titles(title) 
WHERE facility_id IS NULL;
