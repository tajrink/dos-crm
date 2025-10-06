-- Fix auth.users table structure and create demo users properly
-- This migration ensures the auth.users table has the correct structure for Supabase Auth

-- First, let's check if we need to fix the auth.users table structure
-- Create demo users using Supabase's built-in auth functions if possible

-- Create demo user using proper Supabase auth method
-- Note: This approach uses the auth schema directly but with proper constraints

-- Delete existing test users if they exist (to avoid conflicts)
DELETE FROM auth.users WHERE email IN ('hello@devsonsteroids.com', 'admin@devsonsteroids.com');

-- Insert demo user with proper UUID and auth structure
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'hello@devsonsteroids.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{}',
  '{}'
);

-- Insert admin user with proper UUID and auth structure  
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@devsonsteroids.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{}',
  '{}'
);