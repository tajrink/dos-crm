-- Grant permissions to anon and authenticated roles for all tables

-- Clients table
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT SELECT ON clients TO anon;

-- Projects table
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT ON projects TO anon;

-- Invoices table
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO authenticated;
GRANT SELECT ON invoices TO anon;

-- Invoice items table
GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_items TO authenticated;
GRANT SELECT ON invoice_items TO anon;

-- Payments table
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO authenticated;
GRANT SELECT ON payments TO anon;

-- Employees table
GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO authenticated;
GRANT SELECT ON employees TO anon;

-- Team requests table
GRANT SELECT, INSERT, UPDATE, DELETE ON team_requests TO authenticated;
GRANT SELECT ON team_requests TO anon;

-- Features catalog table
GRANT SELECT, INSERT, UPDATE, DELETE ON features_catalog TO authenticated;
GRANT SELECT ON features_catalog TO anon;

-- Budgets table
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO authenticated;
GRANT SELECT ON budgets TO anon;

-- Budget categories table
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_categories TO authenticated;
GRANT SELECT ON budget_categories TO anon;

-- Budget expenses table
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_expenses TO authenticated;
GRANT SELECT ON budget_expenses TO anon;