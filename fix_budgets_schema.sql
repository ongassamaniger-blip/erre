-- Add project_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'project_id') THEN
        ALTER TABLE budgets ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add department_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'department_id') THEN
        ALTER TABLE budgets ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add category_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'category_id') THEN
        ALTER TABLE budgets ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Notify to reload schema
NOTIFY pgrst, 'reload schema';
