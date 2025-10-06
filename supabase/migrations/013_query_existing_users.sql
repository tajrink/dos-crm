-- Query existing users in auth.users table
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmed_at,
    deleted_at
FROM auth.users 
WHERE deleted_at IS NULL
ORDER BY created_at DESC;