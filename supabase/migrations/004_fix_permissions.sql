-- Fix permissions for all tables to allow anon and authenticated access
-- This resolves the "Database error querying schema" issue

-- Grant permissions to anon role (for unauthenticated access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant full permissions to authenticated role (for authenticated users)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure future tables also get proper permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO authenticated;

-- Specifically grant permissions for each table to ensure they work
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON features_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_requests TO authenticated;

-- Grant basic read access to anon role for public data
GRANT SELECT ON clients TO anon;
GRANT SELECT ON projects TO anon;
GRANT SELECT ON employees TO anon;
GRANT SELECT ON features_catalog TO anon;