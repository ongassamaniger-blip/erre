-- Add priority and metadata columns to notifications table
-- This migration adds support for notification priority and metadata storage

-- Add priority column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN priority TEXT DEFAULT 'medium' 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Update type constraint to support more notification types
-- Note: We'll store custom types (like 'approval', 'approved') in metadata
-- and use 'info', 'success', 'warning', 'error' as the base type
-- This maintains DB constraint while supporting frontend types

-- Create index on user_id and read for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications(user_id, read);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON public.notifications(created_at DESC);

