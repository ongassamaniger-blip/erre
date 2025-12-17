ALTER TABLE budget_transfers 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Optional: Update existing records to have a default creator if needed, or leave null
-- UPDATE budget_transfers SET created_by = 'some-user-id' WHERE created_by IS NULL;
