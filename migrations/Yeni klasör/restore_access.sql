-- SAFE RESTORE SCRIPT
-- This script only affects the 'facilities' table to restore access.
-- It does NOT delete any functions used by other parts of the system.

-- 1. Remove the policies we might have created (if they exist)
DROP POLICY IF EXISTS "Users can view accessible facilities" ON facilities;
DROP POLICY IF EXISTS "Facility managers can update their own facility" ON facilities;

-- 2. Disable Row Level Security on the facilities table
-- This ensures that all facilities are visible to all logged-in users (or however it was before)
ALTER TABLE facilities DISABLE ROW LEVEL SECURITY;
