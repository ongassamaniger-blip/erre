-- Add settings column to facilities table
-- This is required for the Settings page to work.

ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
