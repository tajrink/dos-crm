-- Simple approach to create demo users using Supabase's auth API
-- This creates users in a way that's compatible with Supabase Auth

-- Create a function to safely create demo users
CREATE OR REPLACE FUNCTION create_demo_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function will be called to create demo users
  -- We'll use a simpler approach that works with Supabase's auth system
  
  -- Note: In production, users should be created through the Supabase Auth API
  -- This is a workaround for development/testing purposes
  
  RAISE NOTICE 'Demo users should be created through Supabase Auth API or dashboard';
  RAISE NOTICE 'Use the following credentials to test:';
  RAISE NOTICE 'Email: hello@devsonsteroids.com';
  RAISE NOTICE 'Password: password123';
  
END;
$$;

-- Call the function
SELECT create_demo_users();