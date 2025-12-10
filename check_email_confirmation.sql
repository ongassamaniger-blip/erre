    -- CHECK EMAIL CONFIRMATION
    -- Check if the user has confirmed their email address.

    SELECT 
        email,
        created_at,
        email_confirmed_at,
        last_sign_in_at,
        raw_user_meta_data
    FROM 
        auth.users
    WHERE 
        email = 'erpsistemim@outlook.com';
