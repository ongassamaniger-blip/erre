-- FORCE RESET PASSWORD
-- This script resets the password for 'erpsistemim@outlook.com' to 'deneme123'

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the password
UPDATE auth.users
SET 
  encrypted_password = crypt('deneme123', gen_salt('bf')),
  updated_at = NOW()
WHERE 
  email = 'erpsistemim@outlook.com';

-- Verify update (cannot check password, but can check updated_at)
SELECT email, updated_at FROM auth.users WHERE email = 'erpsistemim@outlook.com';
