-- Create demo user for testing login functionality
-- This migration creates a test user with the credentials shown in the Login.tsx demo section

-- Check if demo user already exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'hello@devsonsteroids.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'hello@devsonsteroids.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;

-- Check if admin user already exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@devsonsteroids.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@devsonsteroids.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;