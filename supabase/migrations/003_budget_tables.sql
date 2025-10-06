-- Create budget_categories table
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    department VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget_expenses table
CREATE TABLE budget_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES budget_categories(id),
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_budget_categories_department ON budget_categories(department);
CREATE INDEX idx_budget_categories_is_active ON budget_categories(is_active);
CREATE INDEX idx_budget_expenses_budget_id ON budget_expenses(budget_id);
CREATE INDEX idx_budget_expenses_category_id ON budget_expenses(category_id);
CREATE INDEX idx_budget_expenses_expense_date ON budget_expenses(expense_date);

-- Insert initial budget categories
INSERT INTO budget_categories (name, description, department) VALUES
('Salaries', 'Employee salaries and benefits', 'HR'),
('Software Licenses', 'Development tools and software subscriptions', 'Development'),
('Hardware', 'Computers, servers, and equipment', 'IT'),
('Marketing', 'Advertising and promotional expenses', 'Marketing'),
('Office Supplies', 'General office supplies and materials', 'Operations'),
('Training', 'Employee training and development', 'HR'),
('Travel', 'Business travel and accommodation', 'Operations'),
('Utilities', 'Internet, electricity, and office utilities', 'Operations'),
('Professional Services', 'Legal, accounting, and consulting', 'Operations'),
('Research & Development', 'Innovation and R&D expenses', 'Development');

-- Enable RLS
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations for authenticated users" ON budget_categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON budget_expenses
    FOR ALL USING (auth.role() = 'authenticated');