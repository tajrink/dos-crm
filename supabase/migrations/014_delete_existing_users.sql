-- Delete existing users to recreate them properly
DELETE FROM auth.users WHERE email IN ('hello@devsonsteroids.com', 'admin@devsonsteroids.com');