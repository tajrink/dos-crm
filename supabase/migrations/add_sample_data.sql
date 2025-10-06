-- Add sample data to test the application

-- Insert sample clients
INSERT INTO clients (name, company, contacts, website, total_spend, status, created_at) VALUES
('John Smith', 'Tech Corp', '[{"name": "John Smith", "email": "john@example.com", "phone": "+1-555-0101", "role": "CEO"}]', 'https://techcorp.com', 15000.00, 'Active', NOW()),
('Sarah Johnson', 'Design Studio', '[{"name": "Sarah Johnson", "email": "sarah@example.com", "phone": "+1-555-0102", "role": "Creative Director"}]', 'https://designstudio.com', 8000.00, 'Active', NOW()),
('Mike Wilson', 'Marketing Inc', '[{"name": "Mike Wilson", "email": "mike@example.com", "phone": "+1-555-0103", "role": "Marketing Manager"}]', 'https://marketinginc.com', 12000.00, 'Active', NOW());

-- Insert sample projects
INSERT INTO projects (name, description, client_id, status, project_type, quotation, start_date, end_date, progress_percentage, created_at) VALUES
('Website Redesign', 'Complete website overhaul with modern design', (SELECT id FROM clients WHERE company = 'Tech Corp' LIMIT 1), 'In Progress', '["Web Development", "UI/UX Design"]'::jsonb, '{"total": 15000, "breakdown": {"design": 6000, "development": 9000}}'::jsonb, NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', 65, NOW()),
('Brand Identity', 'Logo and brand guidelines creation', (SELECT id FROM clients WHERE company = 'Design Studio' LIMIT 1), 'In Progress', '["Branding", "Design"]'::jsonb, '{"total": 8000, "breakdown": {"logo": 3000, "guidelines": 5000}}'::jsonb, NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', 40, NOW()),
('Marketing Campaign', 'Digital marketing strategy and execution', (SELECT id FROM clients WHERE company = 'Marketing Inc' LIMIT 1), 'Completed', '["Marketing", "Digital Strategy"]'::jsonb, '{"total": 12000, "breakdown": {"strategy": 5000, "execution": 7000}}'::jsonb, NOW() - INTERVAL '90 days', NOW() - INTERVAL '30 days', 100, NOW());

-- Insert sample invoices
INSERT INTO invoices (invoice_number, client_id, subtotal, tax_rate, tax_amount, total_amount, due_date, status, created_at) VALUES
('INV-001', (SELECT id FROM clients WHERE company = 'Tech Corp' LIMIT 1), 5000.00, 0.10, 500.00, 5500.00, (NOW() + INTERVAL '23 days')::date, 'Sent', NOW()),
('INV-002', (SELECT id FROM clients WHERE company = 'Design Studio' LIMIT 1), 4000.00, 0.10, 400.00, 4400.00, (NOW() - INTERVAL '14 days')::date, 'Paid', NOW()),
('INV-003', (SELECT id FROM clients WHERE company = 'Marketing Inc' LIMIT 1), 12000.00, 0.10, 1200.00, 13200.00, (NOW() - INTERVAL '30 days')::date, 'Paid', NOW());

-- Insert sample payments
INSERT INTO payments (invoice_id, amount, payment_date, payment_method, notes, created_at) VALUES
((SELECT id FROM invoices WHERE invoice_number = 'INV-002' LIMIT 1), 4400.00, NOW() - INTERVAL '14 days', 'bank_transfer', 'Payment completed successfully', NOW()),
((SELECT id FROM invoices WHERE invoice_number = 'INV-003' LIMIT 1), 13200.00, NOW() - INTERVAL '30 days', 'credit_card', 'Payment processed via Stripe', NOW());

-- Insert sample employees
INSERT INTO employees (name, role, department, monthly_salary, is_active, created_at) VALUES
('Alice Cooper', 'Senior Developer', 'Engineering', 7083.33, true, NOW()),
('Bob Martinez', 'UI/UX Designer', 'Design', 5833.33, true, NOW()),
('Carol Davis', 'Project Manager', 'Management', 7500.00, true, NOW());

-- Insert sample team requests
INSERT INTO team_requests (title, description, priority, status, assignee_id, due_date, created_at) VALUES
('Update Dashboard UI', 'Modernize the dashboard interface with new components', 'High', 'In Progress', (SELECT id FROM employees WHERE name = 'Alice Cooper' LIMIT 1), NOW() + INTERVAL '7 days', NOW()),
('Design New Logo', 'Create a fresh logo for the company rebrand', 'Medium', 'Backlog', (SELECT id FROM employees WHERE name = 'Bob Martinez' LIMIT 1), NOW() + INTERVAL '14 days', NOW()),
('Client Meeting Prep', 'Prepare presentation materials for upcoming client meeting', 'High', 'Completed', (SELECT id FROM employees WHERE name = 'Carol Davis' LIMIT 1), NOW() - INTERVAL '1 day', NOW());

-- Insert sample budget categories
INSERT INTO budget_categories (name, description, department, created_at) VALUES
('Marketing', 'Marketing and advertising expenses', 'Marketing', NOW()),
('Development', 'Software development costs', 'Engineering', NOW()),
('Operations', 'General operational expenses', 'Operations', NOW());

-- Insert sample budgets
INSERT INTO budgets (department, category, budgeted_amount, actual_amount, period_start, period_end, created_at) VALUES
('Marketing', 'Marketing', 50000.00, 15000.00, '2024-01-01', '2024-03-31', NOW()),
('Engineering', 'Development', 25000.00, 8000.00, '2024-01-01', '2024-12-31', NOW()),
('Operations', 'Operations', 30000.00, 12000.00, '2024-01-01', '2024-06-30', NOW());

-- Insert sample features
INSERT INTO features_catalog (name, description, category, notes, created_at) VALUES
('Custom Dashboard', 'Personalized dashboard with custom widgets', 'Development', 'Premium feature with advanced customization options', NOW()),
('Advanced Analytics', 'Detailed reporting and analytics suite', 'Development', 'Enterprise-level analytics and reporting tools', NOW()),
('API Integration', 'Third-party API integration service', 'Development', 'Standard API integration capabilities', NOW()),
('Mobile App Design', 'Native mobile application design', 'Mobile', 'iOS and Android compatible designs', NOW()),
('E-commerce Platform', 'Complete online store solution', 'E-comm', 'Full-featured e-commerce platform', NOW());