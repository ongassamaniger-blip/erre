-- Update has_facility_access function to allow Headquarters users to access all facilities
CREATE OR REPLACE FUNCTION has_facility_access(target_facility_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Check if user has direct access to the specific facility
  IF EXISTS (
    SELECT 1 FROM public.facility_users
    WHERE user_id = auth.uid() AND facility_id = target_facility_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check if user belongs to a Headquarters facility (Global Access)
  IF EXISTS (
    SELECT 1 FROM public.facility_users fu
    JOIN public.facilities f ON f.id = fu.facility_id
    WHERE fu.user_id = auth.uid() AND f.type = 'headquarters'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
