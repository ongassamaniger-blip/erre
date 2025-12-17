-- Add settings column to facilities table
ALTER TABLE public.facilities 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.facilities.settings IS 'Stores facility-specific settings (general, contact, financial, etc.) as JSON';

-- Create a function to initialize default settings if null (optional, but good for data integrity)
CREATE OR REPLACE FUNCTION initialize_facility_settings() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.settings IS NULL THEN
    NEW.settings := '{}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure settings is never null on insert
DROP TRIGGER IF EXISTS ensure_facility_settings ON public.facilities;
CREATE TRIGGER ensure_facility_settings
BEFORE INSERT ON public.facilities
FOR EACH ROW
EXECUTE FUNCTION initialize_facility_settings();
