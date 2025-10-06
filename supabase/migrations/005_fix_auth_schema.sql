-- Fix auth schema permissions and ensure proper access
-- This addresses the "Database error querying schema" issue specifically for auth operations

-- Grant necessary permissions on auth schema to anon and authenticated roles
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON auth.users TO anon, authenticated;
GRANT SELECT ON auth.sessions TO anon, authenticated;
GRANT SELECT ON auth.refresh_tokens TO anon, authenticated;

-- Ensure the auth schema functions are accessible
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated;

-- Create a simple RLS policy for public tables that allows all operations for authenticated users
-- and read-only for anonymous users

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Enable read access for all users" ON public.clients;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.clients;

CREATE POLICY "Enable read access for all users" ON public.clients
    FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.clients
    FOR ALL USING (auth.role() = 'authenticated');

-- Apply similar policies to other tables
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.projects;

CREATE POLICY "Enable read access for all users" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.projects
    FOR ALL USING (auth.role() = 'authenticated');

-- For employees table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.employees;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.employees;

CREATE POLICY "Enable read access for all users" ON public.employees
    FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.employees
    FOR ALL USING (auth.role() = 'authenticated');

-- For invoices table
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.invoices;

CREATE POLICY "Enable all operations for authenticated users" ON public.invoices
    FOR ALL USING (auth.role() = 'authenticated');

-- For other tables, create simple policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.invoice_items;
CREATE POLICY "Enable all operations for authenticated users" ON public.invoice_items
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.payments;
CREATE POLICY "Enable all operations for authenticated users" ON public.payments
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.budgets;
CREATE POLICY "Enable all operations for authenticated users" ON public.budgets
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.budget_categories;
CREATE POLICY "Enable all operations for authenticated users" ON public.budget_categories
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.budget_expenses;
CREATE POLICY "Enable all operations for authenticated users" ON public.budget_expenses
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable read access for all users" ON public.features_catalog;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.features_catalog;

CREATE POLICY "Enable read access for all users" ON public.features_catalog
    FOR SELECT USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON public.features_catalog
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.team_requests;
CREATE POLICY "Enable all operations for authenticated users" ON public.team_requests
    FOR ALL USING (auth.role() = 'authenticated');