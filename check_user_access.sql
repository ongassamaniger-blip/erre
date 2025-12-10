-- CHECK USER ACCESS
-- Check if the user has facility access and if the facility exists.

SELECT 
    u.email,
    p.role,
    COUNT(fu.id) as facility_access_count,
    f.code as facility_code,
    f.name as facility_name
FROM 
    auth.users u
    JOIN public.profiles p ON u.id = p.id
    LEFT JOIN public.facility_users fu ON u.id = fu.user_id
    LEFT JOIN public.facilities f ON fu.facility_id = f.id
GROUP BY 
    u.email, p.role, f.code, f.name;
