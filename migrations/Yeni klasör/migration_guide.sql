-- Migration Guide for Multi-tenancy, Snapshotting, and Soft Delete

-- 1. Multi-tenancy: Add organization_id to all major tables
-- This allows multiple organizations to use the same database instance securely.

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add organization_id to users (profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to other tables
ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE vendors_customers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Enable RLS on all tables (Example for projects)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy for projects (Users can only see projects in their organization)
CREATE POLICY "Users can view projects in their organization" ON projects
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Repeat similar policies for all other tables.


-- 2. Snapshotting: Add snapshot columns to transactions
-- This ensures that historical financial data remains accurate even if linked records change.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS snapshot_category_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS snapshot_vendor_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS snapshot_project_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS snapshot_department_name TEXT;

-- Trigger to populate snapshot columns on insert/update
CREATE OR REPLACE FUNCTION populate_transaction_snapshots()
RETURNS TRIGGER AS $$
BEGIN
  -- Fetch names if IDs are present
  IF NEW.category_id IS NOT NULL THEN
    SELECT name INTO NEW.snapshot_category_name FROM categories WHERE id = NEW.category_id;
  END IF;
  
  IF NEW.vendor_customer_id IS NOT NULL THEN
    SELECT name INTO NEW.snapshot_vendor_name FROM vendors_customers WHERE id = NEW.vendor_customer_id;
  END IF;

  IF NEW.project_id IS NOT NULL THEN
    SELECT name INTO NEW.snapshot_project_name FROM projects WHERE id = NEW.project_id;
  END IF;

  IF NEW.department_id IS NOT NULL THEN
    SELECT name INTO NEW.snapshot_department_name FROM departments WHERE id = NEW.department_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_populate_transaction_snapshots
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION populate_transaction_snapshots();


-- 3. Soft Delete: Add is_deleted column
-- This allows for safe deletion (archiving) without losing data integrity.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors_customers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Update RLS policies to exclude deleted items by default (Example)
-- CREATE POLICY "Active projects only" ON projects
--   FOR SELECT USING (
--     organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
--     AND is_deleted = FALSE
--   );
