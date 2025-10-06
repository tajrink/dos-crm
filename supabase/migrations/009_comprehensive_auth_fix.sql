-- Comprehensive auth schema fix
-- This migration addresses all auth schema permission issues

-- First, ensure we have proper schema permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant comprehensive permissions on auth schema
GRANT ALL ON SCHEMA auth TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;

-- Specifically grant permissions on critical auth tables
GRANT SELECT ON auth.users TO anon, authenticated, service_role;
GRANT SELECT ON auth.sessions TO anon, authenticated, service_role;
GRANT SELECT ON auth.refresh_tokens TO anon, authenticated, service_role;
GRANT SELECT ON auth.audit_log_entries TO anon, authenticated, service_role;
GRANT SELECT ON auth.instances TO anon, authenticated, service_role;
GRANT SELECT ON auth.schema_migrations TO anon, authenticated, service_role;

-- Grant full permissions to service_role for user management
GRANT ALL ON auth.users TO service_role;
GRANT ALL ON auth.sessions TO service_role;
GRANT ALL ON auth.refresh_tokens TO service_role;
GRANT ALL ON auth.audit_log_entries TO service_role;
GRANT ALL ON auth.instances TO service_role;
GRANT ALL ON auth.identities TO service_role;
GRANT ALL ON auth.mfa_factors TO service_role;
GRANT ALL ON auth.mfa_challenges TO service_role;
GRANT ALL ON auth.mfa_amr_claims TO service_role;
GRANT ALL ON auth.sso_providers TO service_role;
GRANT ALL ON auth.sso_domains TO service_role;
GRANT ALL ON auth.saml_providers TO service_role;
GRANT ALL ON auth.saml_relay_states TO service_role;
GRANT ALL ON auth.flow_state TO service_role;
GRANT ALL ON auth.one_time_tokens TO service_role;

-- Grant permissions on auth sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;

-- Ensure public schema permissions are correct
GRANT ALL ON SCHEMA public TO postgres, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Disable RLS on public tables for testing
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budget_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budget_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.features_catalog DISABLE ROW LEVEL SECURITY;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload');

-- Create a test notification
DO $$
BEGIN
    RAISE NOTICE 'Comprehensive auth schema permissions applied successfully';
END $$;