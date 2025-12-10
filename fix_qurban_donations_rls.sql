-- Enable RLS on the table (just in case)
ALTER TABLE qurban_donations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON qurban_donations;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON qurban_donations;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON qurban_donations;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON qurban_donations;

-- Create comprehensive policies
CREATE POLICY "Enable read access for authenticated users"
ON qurban_donations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON qurban_donations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON qurban_donations FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Enable delete access for authenticated users"
ON qurban_donations FOR DELETE
TO authenticated
USING (true);
