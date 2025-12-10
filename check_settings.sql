-- Check if settings column exists and has data

SELECT 
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'facilities' AND column_name = 'settings') as settings_column_exists,
  (SELECT count(*) FROM facilities WHERE settings IS NULL) as null_settings_count,
  (SELECT count(*) FROM facilities) as total_facilities;
