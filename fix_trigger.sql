-- Fix for "relation transaction_categories does not exist" error
-- Run this in your Supabase SQL Editor

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
