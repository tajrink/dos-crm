-- HRM System Comprehensive Migration
-- This migration creates the complete HRM system database schema

-- Drop existing employees table and recreate with enhanced schema
DROP TABLE IF EXISTS employees CASCADE;

-- Enhanced Employees Table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
    joining_date DATE NOT NULL,
    leaving_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
    base_salary DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'BDT')),
    skills JSONB DEFAULT '[]',
    qualifications JSONB DEFAULT '[]',
    emergency_contact JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for employees
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_employment_type ON employees(employment_type);

-- Payroll Records Table
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_rate DECIMAL(8,2) DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    deductions JSONB DEFAULT '[]',
    tax_amount DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'BDT')),
    exchange_rate DECIMAL(10,4),
    payment_date DATE,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payroll_records
CREATE INDEX idx_payroll_employee_id ON payroll_records(employee_id);
CREATE INDEX idx_payroll_pay_period ON payroll_records(pay_period_start, pay_period_end);
CREATE INDEX idx_payroll_status ON payroll_records(status);

-- Leave Requests Table
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'casual', 'maternity', 'paternity')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for leave_requests
CREATE INDEX idx_leave_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);

-- Performance Reviews Table
CREATE TABLE performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES employees(id),
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    goals JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    areas_for_improvement JSONB DEFAULT '[]',
    salary_recommendation DECIMAL(12,2),
    promotion_recommendation BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance_reviews
CREATE INDEX idx_performance_employee_id ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviewer_id ON performance_reviews(reviewer_id);
CREATE INDEX idx_performance_status ON performance_reviews(status);

-- Employee Documents Table
CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('resume', 'contract', 'certificate', 'id_document', 'other')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for employee_documents
CREATE INDEX idx_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_documents_type ON employee_documents(document_type);

-- Salary History Table
CREATE TABLE salary_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    previous_salary DECIMAL(12,2),
    new_salary DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'BDT')),
    change_reason VARCHAR(255),
    effective_date DATE NOT NULL,
    changed_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for salary_history
CREATE INDEX idx_salary_history_employee_id ON salary_history(employee_id);
CREATE INDEX idx_salary_history_effective_date ON salary_history(effective_date);

-- Row Level Security Policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON employees TO anon;
GRANT ALL PRIVILEGES ON employees TO authenticated;
GRANT ALL PRIVILEGES ON payroll_records TO authenticated;
GRANT ALL PRIVILEGES ON leave_requests TO authenticated;
GRANT ALL PRIVILEGES ON performance_reviews TO authenticated;
GRANT ALL PRIVILEGES ON employee_documents TO authenticated;
GRANT ALL PRIVILEGES ON salary_history TO authenticated;

-- Insert sample HRM data
INSERT INTO employees (name, email, role, department, joining_date, base_salary, currency, status, phone, address, employment_type, skills, qualifications, emergency_contact, notes) VALUES
('Alice Johnson', 'alice@company.com', 'Senior Developer', 'Engineering', '2023-01-15', 8500.00, 'USD', 'active', '+1-555-0101', '123 Tech Street, San Francisco, CA', 'full_time', '["React", "TypeScript", "Node.js", "PostgreSQL"]', '["B.S. Computer Science", "AWS Certified"]', '{"name": "John Johnson", "phone": "+1-555-0102", "relationship": "Spouse"}', 'Excellent performance, team lead for frontend projects'),
('Bob Smith', 'bob@company.com', 'UI/UX Designer', 'Design', '2023-03-01', 6500.00, 'USD', 'active', '+1-555-0201', '456 Design Ave, New York, NY', 'full_time', '["Figma", "Adobe Creative Suite", "Prototyping", "User Research"]', '["B.A. Graphic Design", "UX Certification"]', '{"name": "Sarah Smith", "phone": "+1-555-0202", "relationship": "Sister"}', 'Creative designer with strong user experience focus'),
('Carol Williams', 'carol@company.com', 'Project Manager', 'Management', '2022-11-10', 7500.00, 'USD', 'active', '+1-555-0301', '789 Business Blvd, Chicago, IL', 'full_time', '["Agile", "Scrum", "Project Planning", "Team Leadership"]', '["MBA", "PMP Certified"]', '{"name": "Mike Williams", "phone": "+1-555-0302", "relationship": "Husband"}', 'Experienced project manager with excellent leadership skills'),
('David Brown', 'david@company.com', 'Backend Developer', 'Engineering', '2023-06-01', 7000.00, 'USD', 'active', '+1-555-0401', '321 Code Lane, Austin, TX', 'full_time', '["Python", "Django", "PostgreSQL", "Docker"]', '["B.S. Software Engineering"]', '{"name": "Lisa Brown", "phone": "+1-555-0402", "relationship": "Mother"}', 'Strong backend developer with database expertise'),
('Emma Davis', 'emma@company.com', 'Marketing Specialist', 'Marketing', '2023-04-15', 5500.00, 'USD', 'active', '+1-555-0501', '654 Marketing St, Los Angeles, CA', 'full_time', '["Digital Marketing", "SEO", "Content Creation", "Analytics"]', '["B.A. Marketing", "Google Analytics Certified"]', '{"name": "Tom Davis", "phone": "+1-555-0502", "relationship": "Brother"}', 'Creative marketing professional with strong analytical skills');

-- Insert sample payroll records
INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, base_salary, bonuses, tax_amount, net_salary, currency, status, payment_date) 
SELECT 
    id,
    '2024-01-01'::date,
    '2024-01-31'::date,
    base_salary,
    CASE 
        WHEN base_salary > 8000 THEN 500.00
        WHEN base_salary > 6000 THEN 300.00
        ELSE 200.00
    END as bonuses,
    base_salary * 0.25 as tax_amount,
    base_salary + CASE 
        WHEN base_salary > 8000 THEN 500.00
        WHEN base_salary > 6000 THEN 300.00
        ELSE 200.00
    END - (base_salary * 0.25) as net_salary,
    currency,
    'paid',
    '2024-02-01'::date
FROM employees WHERE status = 'active';

-- Insert sample leave requests
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status) 
SELECT 
    id,
    'annual',
    '2024-03-15'::date,
    '2024-03-19'::date,
    5,
    'Family vacation',
    'approved'
FROM employees WHERE name = 'Alice Johnson';

INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_requested, reason, status) 
SELECT 
    id,
    'sick',
    '2024-02-20'::date,
    '2024-02-21'::date,
    2,
    'Medical appointment',
    'approved'
FROM employees WHERE name = 'Bob Smith';

-- Insert sample performance reviews
INSERT INTO performance_reviews (employee_id, reviewer_id, review_period_start, review_period_end, overall_rating, goals, achievements, areas_for_improvement, salary_recommendation, status)
SELECT 
    e1.id as employee_id,
    e2.id as reviewer_id,
    '2023-07-01'::date,
    '2023-12-31'::date,
    4,
    '["Complete React migration", "Mentor junior developers", "Improve code quality"]',
    '["Led successful frontend refactor", "Mentored 2 junior developers", "Reduced bug reports by 30%"]',
    '["Backend knowledge", "Public speaking"]',
    9000.00,
    'approved'
FROM employees e1, employees e2 
WHERE e1.name = 'Alice Johnson' AND e2.name = 'Carol Williams';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();