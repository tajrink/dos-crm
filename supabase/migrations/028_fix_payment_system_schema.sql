-- Fix Payment System Schema and Data Issues
-- This migration addresses the mismatch between frontend expectations and database schema

-- First, let's check if the payment tables exist and drop them if they do
DROP TABLE IF EXISTS payment_approvals CASCADE;
DROP TABLE IF EXISTS payment_schedules CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;

-- Recreate payment_history table with proper structure
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(100) NOT NULL, -- Added for frontend compatibility
  department VARCHAR(50) NOT NULL, -- Added for frontend compatibility
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'BDT')),
  payment_method VARCHAR(50) DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash', 'check', 'digital_wallet')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'failed', 'cancelled')),
  payment_date DATE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  transaction_id VARCHAR(100) UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate payment_schedules table with proper structure
CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(100) NOT NULL, -- Added for frontend compatibility
  department VARCHAR(50) NOT NULL, -- Added for frontend compatibility
  amount DECIMAL(12,2) NOT NULL, -- Renamed from scheduled_amount for consistency
  currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'BDT')),
  scheduled_date DATE NOT NULL,
  frequency VARCHAR(20) DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'bi_weekly', 'monthly', 'quarterly')),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending_approval', 'approved', 'cancelled')),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate payment_approvals table with proper structure
CREATE TABLE payment_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID, -- Generic payment reference
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(100) NOT NULL, -- Added for frontend compatibility
  amount DECIMAL(12,2) NOT NULL, -- Added for frontend compatibility
  currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'BDT')), -- Added for frontend compatibility
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by VARCHAR(100) NOT NULL, -- Added for frontend compatibility
  approver_id UUID REFERENCES employees(id),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_payment_history_employee_id ON payment_history(employee_id);
CREATE INDEX idx_payment_history_payment_date ON payment_history(payment_date DESC);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_department ON payment_history(department);

CREATE INDEX idx_payment_schedules_employee_id ON payment_schedules(employee_id);
CREATE INDEX idx_payment_schedules_scheduled_date ON payment_schedules(scheduled_date);
CREATE INDEX idx_payment_schedules_status ON payment_schedules(status);
CREATE INDEX idx_payment_schedules_department ON payment_schedules(department);

CREATE INDEX idx_payment_approvals_employee_id ON payment_approvals(employee_id);
CREATE INDEX idx_payment_approvals_status ON payment_approvals(status);

-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_approvals ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON payment_history TO anon;
GRANT ALL PRIVILEGES ON payment_history TO authenticated;
GRANT SELECT ON payment_schedules TO anon;
GRANT ALL PRIVILEGES ON payment_schedules TO authenticated;
GRANT SELECT ON payment_approvals TO anon;
GRANT ALL PRIVILEGES ON payment_approvals TO authenticated;

-- Create RLS policies
CREATE POLICY "Users can view payment history" ON payment_history FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage payment history" ON payment_history FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view payment schedules" ON payment_schedules FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage payment schedules" ON payment_schedules FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view payment approvals" ON payment_approvals FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage payment approvals" ON payment_approvals FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample payment history data based on existing employees
INSERT INTO payment_history (employee_id, employee_name, department, amount, currency, payment_method, status, payment_date, processed_at, transaction_id, notes)
SELECT 
  e.id,
  e.name,
  e.department,
  e.base_salary,
  e.currency,
  'bank_transfer',
  'paid',
  DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month',
  DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' + INTERVAL '5 days',
  'TXN-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
  'Monthly salary payment'
FROM employees e
WHERE e.status = 'active'
LIMIT 20;

-- Insert more recent payment history
INSERT INTO payment_history (employee_id, employee_name, department, amount, currency, payment_method, status, payment_date, processed_at, transaction_id, notes)
SELECT 
  e.id,
  e.name,
  e.department,
  e.base_salary,
  e.currency,
  CASE 
    WHEN random() < 0.8 THEN 'bank_transfer'
    WHEN random() < 0.9 THEN 'digital_wallet'
    ELSE 'check'
  END,
  CASE 
    WHEN random() < 0.85 THEN 'paid'
    WHEN random() < 0.95 THEN 'pending'
    ELSE 'failed'
  END,
  DATE_TRUNC('month', CURRENT_DATE),
  CASE 
    WHEN random() < 0.7 THEN DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '3 days'
    ELSE NULL
  END,
  'TXN-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
  'Current month salary payment'
FROM employees e
WHERE e.status = 'active'
LIMIT 25;

-- Insert upcoming payment schedules
INSERT INTO payment_schedules (employee_id, employee_name, department, amount, currency, scheduled_date, frequency, status)
SELECT 
  e.id,
  e.name,
  e.department,
  e.base_salary,
  e.currency,
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
  'monthly',
  CASE 
    WHEN random() < 0.6 THEN 'scheduled'
    WHEN random() < 0.8 THEN 'pending_approval'
    ELSE 'approved'
  END
FROM employees e
WHERE e.status = 'active'
LIMIT 30;

-- Insert some bonus payments
INSERT INTO payment_schedules (employee_id, employee_name, department, amount, currency, scheduled_date, frequency, status)
SELECT 
  e.id,
  e.name,
  e.department,
  e.base_salary * 0.1, -- 10% bonus
  e.currency,
  CURRENT_DATE + INTERVAL '15 days',
  'quarterly',
  'pending_approval'
FROM employees e
WHERE e.status = 'active' AND e.department IN ('Engineering', 'Sales', 'Marketing')
LIMIT 10;

-- Insert payment approvals for pending payments
INSERT INTO payment_approvals (payment_id, employee_id, employee_name, amount, currency, status, requested_by, comments)
SELECT 
  ps.id,
  ps.employee_id,
  ps.employee_name,
  ps.amount,
  ps.currency,
  'pending',
  'HR Manager',
  CASE 
    WHEN ps.frequency = 'quarterly' THEN 'Quarterly bonus approval required'
    ELSE 'Regular salary payment approval'
  END
FROM payment_schedules ps
WHERE ps.status = 'pending_approval'
LIMIT 15;

-- Create triggers to automatically update employee_name and department when employee data changes
CREATE OR REPLACE FUNCTION update_payment_employee_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Update payment_history
  UPDATE payment_history 
  SET employee_name = NEW.name, department = NEW.department
  WHERE employee_id = NEW.id;
  
  -- Update payment_schedules
  UPDATE payment_schedules 
  SET employee_name = NEW.name, department = NEW.department
  WHERE employee_id = NEW.id;
  
  -- Update payment_approvals
  UPDATE payment_approvals 
  SET employee_name = NEW.name
  WHERE employee_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on employees table
CREATE TRIGGER trigger_update_payment_employee_info
  AFTER UPDATE OF name, department ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_employee_info();