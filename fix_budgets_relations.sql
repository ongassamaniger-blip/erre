-- Add foreign key for projects if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'budgets_project_id_fkey') THEN 
        ALTER TABLE budgets 
        ADD CONSTRAINT budgets_project_id_fkey 
        FOREIGN KEY (project_id) 
        REFERENCES projects(id) 
        ON DELETE SET NULL; 
    END IF; 
END $$;

-- Add foreign key for departments if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'budgets_department_id_fkey') THEN 
        ALTER TABLE budgets 
        ADD CONSTRAINT budgets_department_id_fkey 
        FOREIGN KEY (department_id) 
        REFERENCES departments(id) 
        ON DELETE SET NULL; 
    END IF; 
END $$;

-- Notify Supabase to reload schema cache (sometimes needed)
NOTIFY pgrst, 'reload schema';
