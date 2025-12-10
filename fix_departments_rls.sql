-- Enable RLS on departments table (ensure it's enabled)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policy if it exists (to avoid conflicts or restrictive old policies)
DROP POLICY IF EXISTS "Enable read access for all users" ON departments;
DROP POLICY IF EXISTS "Authenticated users can select departments" ON departments;

-- Create a permissive SELECT policy for authenticated users
-- This allows fetching ALL departments, including those with is_active = false
CREATE POLICY "Authenticated users can select departments" ON departments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Ensure update policy allows updating is_active
DROP POLICY IF EXISTS "Authenticated users can update departments" ON departments;
CREATE POLICY "Authenticated users can update departments" ON departments
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Ensure insert policy exists
DROP POLICY IF EXISTS "Authenticated users can insert departments" ON departments;
CREATE POLICY "Authenticated users can insert departments" ON departments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Ensure delete policy exists (though we are using soft delete now)
DROP POLICY IF EXISTS "Authenticated users can delete departments" ON departments;
CREATE POLICY "Authenticated users can delete departments" ON departments
  FOR DELETE
  USING (auth.role() = 'authenticated');
