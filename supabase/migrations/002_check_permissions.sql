-- Check current permissions for anon and authenticated roles
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON clients, projects, invoices, invoice_items, payments, employees, features_catalog, team_requests, budgets, budget_categories, budget_expenses TO anon;
GRANT ALL PRIVILEGES ON clients, projects, invoices, invoice_items, payments, employees, features_catalog, team_requests, budgets, budget_categories, budget_expenses TO authenticated;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE features_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON clients;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON projects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON invoice_items;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON payments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON employees;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON features_catalog;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON team_requests;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON budgets;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON budget_categories;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON budget_expenses;

-- Create RLS policies for authenticated users (single admin user)
CREATE POLICY "Allow all operations for authenticated users" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON projects
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON invoice_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON payments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON employees
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON features_catalog
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON team_requests
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON budgets
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON budget_categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON budget_expenses
  FOR ALL USING (auth.role() = 'authenticated');