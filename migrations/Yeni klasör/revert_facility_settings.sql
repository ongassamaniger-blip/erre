-- Revert RLS changes on facilities table
-- This will restore access if RLS was previously disabled

-- 1. Drop the policies we added
DROP POLICY IF EXISTS "Users can view accessible facilities" ON facilities;
DROP POLICY IF EXISTS "Facility managers can update their own facility" ON facilities;

-- 2. Disable RLS on the table (This is likely what caused the "data loss" - enabling RLS without matching policies)
ALTER TABLE facilities DISABLE ROW LEVEL SECURITY;

-- 3. Drop the helper function (optional, but keeps things clean)
DROP FUNCTION IF EXISTS has_facility_access;
