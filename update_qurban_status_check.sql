-- Drop the existing check constraint
ALTER TABLE qurban_campaigns DROP CONSTRAINT IF EXISTS qurban_campaigns_status_check;

-- Add the new check constraint with updated statuses
ALTER TABLE qurban_campaigns
ADD CONSTRAINT qurban_campaigns_status_check 
CHECK (status IN ('planning', 'active', 'completed', 'archived', 'pending_approval', 'rejected'));
