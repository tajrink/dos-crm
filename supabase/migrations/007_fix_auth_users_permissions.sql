-- Fix auth.users table permissions for authentication
-- This migration specifically addresses the "Database error querying schema" issue

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Grant specific permissions on auth.users table
GRANT SELECT ON auth.users TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON auth.users TO authenticated, service_role;

-- Grant permissions on auth sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated, service_role;

-- Grant execute permissions on auth functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;

-- Ensure auth.users table has proper RLS policies
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy for auth.users (if it doesn't exist)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own profile" ON auth.users;
    DROP POLICY IF EXISTS "Enable read access for all users" ON auth.users;
    
    -- Create new permissive policy for reading user data
    CREATE POLICY "Enable read access for authenticated users" ON auth.users
        FOR SELECT USING (true);
        
    -- Allow users to update their own profile
    CREATE POLICY "Users can update own profile" ON auth.users
        FOR UPDATE USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Policy already exists, ignore
END $$;

-- Grant permissions on other critical auth tables
GRANT SELECT ON auth.sessions TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON auth.sessions TO authenticated, service_role;

GRANT SELECT ON auth.refresh_tokens TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON auth.refresh_tokens TO authenticated, service_role;

-- Ensure public schema tables have proper permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Update RLS policies for public tables to be more permissive for testing
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON public.%I', table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.%I', table_name);
        
        -- Create new permissive policies
        EXECUTE format('CREATE POLICY "Enable read access for all users" ON public.%I FOR SELECT USING (true)', table_name);
        EXECUTE format('CREATE POLICY "Enable all operations for authenticated users" ON public.%I FOR ALL USING (true)', table_name);
    END LOOP;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';