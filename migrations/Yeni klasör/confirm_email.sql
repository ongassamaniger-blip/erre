-- CONFIRM EMAIL MANUALLY
-- This script forces the email to be confirmed.

UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW(),
  last_sign_in_at = NULL -- Reset sign in to force fresh login
WHERE 
  email = 'erpsistemim@outlook.com';

-- Verify the result
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'erpsistemim@outlook.com';
