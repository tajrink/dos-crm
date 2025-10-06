-- HRM Salary Payment Tracking System Database Tables
-- Create payment history table
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_record_id UUID REFERENCES payroll_records(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'BDT')),
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_date DATE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  transaction_id VARCHAR(100) UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment schedules table
CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  scheduled_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'BDT')),
  scheduled_date DATE NOT NULL,
  frequency VARCHAR(20) DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'bi_weekly', 'monthly', 'quarterly')),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending_approval', 'approved', 'processed', 'cancelled')),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment approvals table
CREATE TABLE payment_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_schedule_id UUID REFERENCES payment_schedules(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_payment_history_employee_id ON payment_history(employee_id);
CREATE INDEX idx_payment_history_payment_date ON payment_history(payment_date DESC);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_schedules_employee_id ON payment_schedules(employee_id);
CREATE INDEX idx_payment_schedules_scheduled_date ON payment_schedules(scheduled_date);
CREATE INDEX idx_payment_schedules_status ON payment_schedules(status);

-- Row Level Security policies
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

-- Insert sample payment history data
INSERT INTO payment_history (payroll_record_id, employee_id, amount, currency, payment_method, status, payment_date, processed_at, transaction_id, notes)
SELECT 
  pr.id,
  pr.employee_id,
  pr.net_salary,
  pr.currency,
  'bank_transfer',
  'completed',
  (pr.pay_period_end::date + interval '5 days')::date,
  (pr.pay_period_end::date + interval '5 days' + interval '2 hours')::timestamp,
  'TXN_' || substr(md5(random()::text), 1, 10),
  'Monthly salary payment processed successfully'
FROM payroll_records pr
WHERE pr.status = 'paid'
LIMIT 50;

-- Insert additional sample payment history for different months
INSERT INTO payment_history (employee_id, amount, currency, payment_method, status, payment_date, processed_at, transaction_id, notes)
SELECT 
  e.id,
  e.base_salary + (random() * 500)::decimal(12,2), -- Add some variation
  e.currency,
  CASE 
    WHEN random() < 0.8 THEN 'bank_transfer'
    WHEN random() < 0.9 THEN 'check'
    ELSE 'cash'
  END,
  CASE 
    WHEN random() < 0.9 THEN 'completed'
    WHEN random() < 0.95 THEN 'processing'
    ELSE 'failed'
  END,
  (date_trunc('month', CURRENT_DATE) - interval '1 month' + interval '25 days')::date,
  (date_trunc('month', CURRENT_DATE) - interval '1 month' + interval '25 days' + interval '3 hours')::timestamp,
  'TXN_' || substr(md5(random()::text), 1, 10),
  'Previous month salary payment'
FROM employees e
WHERE e.status = 'active'
LIMIT 30;

-- Insert sample payment schedules for upcoming months
INSERT INTO payment_schedules (employee_id, scheduled_amount, currency, scheduled_date, frequency, status)
SELECT 
  e.id,
  e.base_salary,
  e.currency,
  (date_trunc('month', CURRENT_DATE) + interval '1 month' + interval '25 days')::date,
  'monthly',
  CASE 
    WHEN random() < 0.7 THEN 'scheduled'
    WHEN random() < 0.9 THEN 'pending_approval'
    ELSE 'approved'
  END
FROM employees e
WHERE e.status = 'active'
LIMIT 25;

-- Insert next month's schedules
INSERT INTO payment_schedules (employee_id, scheduled_amount, currency, scheduled_date, frequency, status)
SELECT 
  e.id,
  e.base_salary,
  e.currency,
  (date_trunc('month', CURRENT_DATE) + interval '2 months' + interval '25 days')::date,
  'monthly',
  'scheduled'
FROM employees e
WHERE e.status = 'active'
LIMIT 20;

-- Insert sample payment approvals
INSERT INTO payment_approvals (payment_schedule_id, approver_id, status, comments)
SELECT 
  ps.id,
  (SELECT id FROM employees WHERE role = 'HR Manager' LIMIT 1),
  CASE 
    WHEN random() < 0.6 THEN 'approved'
    WHEN random() < 0.8 THEN 'pending'
    ELSE 'rejected'
  END,
  CASE 
    WHEN random() < 0.3 THEN 'Approved for regular monthly payment'
    WHEN random() < 0.6 THEN 'Pending review for amount verification'
    ELSE 'Standard monthly salary approval'
  END
FROM payment_schedules ps
WHERE ps.status IN ('pending_approval', 'approved')
LIMIT 15;