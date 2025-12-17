-- Ensure settings column exists in facilities table
ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Enable RLS on facilities table
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Helper function to check facility access (ensure it exists)
CREATE OR REPLACE FUNCTION has_facility_access(target_facility_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.facility_users
    WHERE user_id = auth.uid() AND facility_id = target_facility_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy to allow facility users to view their own facility
-- (Dropping first to avoid "policy already exists" error if re-running)
DROP POLICY IF EXISTS "Users can view accessible facilities" ON facilities;
CREATE POLICY "Users can view accessible facilities" 
ON facilities 
FOR SELECT 
USING (
  has_facility_access(id) OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Super Admin')
);

-- Policy to allow facility managers/admins to update their own facility settings
DROP POLICY IF EXISTS "Facility managers can update their own facility" ON facilities;
CREATE POLICY "Facility managers can update their own facility" 
ON facilities 
FOR UPDATE 
USING (
  (has_facility_access(id) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Super Admin'))
  AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Super Admin', 'Admin', 'Manager')
  )
)
WITH CHECK (
  (has_facility_access(id) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Super Admin'))
  AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Super Admin', 'Admin', 'Manager')
  )
);
