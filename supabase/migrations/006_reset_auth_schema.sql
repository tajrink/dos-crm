-- Reset and fix auth schema completely
-- This addresses the persistent "Database error querying schema" and "Database error checking email" issues

-- First, ensure the auth schema exists and has proper permissions
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Grant all privileges on auth schema to service_role
GRANT ALL ON SCHEMA auth TO service_role;

-- Ensure auth.users table has proper structure and permissions
-- Note: We don't recreate auth tables as they're managed by Supabase
-- Instead, we ensure proper permissions

-- Grant permissions on auth tables to necessary roles
GRANT SELECT ON auth.users TO anon, authenticated;
GRANT ALL ON auth.users TO service_role;

GRANT SELECT ON auth.sessions TO anon, authenticated;
GRANT ALL ON auth.sessions TO service_role;

GRANT SELECT ON auth.refresh_tokens TO anon, authenticated;
GRANT ALL ON auth.refresh_tokens TO service_role;

-- Grant permissions on all auth tables
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;

-- Grant permissions on auth sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;

-- Grant execute permissions on auth functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;

-- Ensure public schema permissions are correct
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Re-grant permissions on public tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;

-- Grant permissions on public sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Ensure RLS is enabled but with permissive policies for testing
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.features_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_requests ENABLE ROW LEVEL SECURITY;

-- Create very permissive policies for testing (can be tightened later)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.clients;
CREATE POLICY "Allow all for authenticated users" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.projects;
CREATE POLICY "Allow all for authenticated users" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.employees;
CREATE POLICY "Allow all for authenticated users" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.invoices;
CREATE POLICY "Allow all for authenticated users" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.invoice_items;
CREATE POLICY "Allow all for authenticated users" ON public.invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.payments;
CREATE POLICY "Allow all for authenticated users" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.budgets;
CREATE POLICY "Allow all for authenticated users" ON public.budgets FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.budget_categories;
CREATE POLICY "Allow all for authenticated users" ON public.budget_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.budget_expenses;
CREATE POLICY "Allow all for authenticated users" ON public.budget_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.features_catalog;
CREATE POLICY "Allow all for authenticated users" ON public.features_catalog FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.team_requests;
CREATE POLICY "Allow all for authenticated users" ON public.team_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anon users to read some tables for initial app loading
DROP POLICY IF EXISTS "Allow read for anon users" ON public.clients;
CREATE POLICY "Allow read for anon users" ON public.clients FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow read for anon users" ON public.projects;
CREATE POLICY "Allow read for anon users" ON public.projects FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow read for anon users" ON public.features_catalog;
CREATE POLICY "Allow read for anon users" ON public.features_catalog FOR SELECT TO anon USING (true);