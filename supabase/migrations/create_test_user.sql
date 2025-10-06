-- Create test user directly in auth.users table
-- This creates a user with email: admin@devsonsteroids.com and password: password123

DO $$
DECLARE
    user_uuid uuid := '550e8400-e29b-41d4-a716-446655440000'::uuid; -- Fixed UUID for test user
BEGIN
    -- Insert into auth.users table
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        user_uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        'admin@devsonsteroids.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{}',
        '{}'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Insert corresponding identity record
    INSERT INTO auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        'admin@devsonsteroids.com',
        user_uuid,
        jsonb_build_object(
            'sub', user_uuid::text,
            'email', 'admin@devsonsteroids.com',
            'email_verified', true
        ),
        'email',
        NOW(),
        NOW()
    ) ON CONFLICT (provider, provider_id) DO NOTHING;
END $$;