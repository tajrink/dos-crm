-- Add sample payment data for testing
-- First, let's get some employee IDs
DO $$
DECLARE
    emp1_id UUID;
    emp2_id UUID;
    emp3_id UUID;
BEGIN
    -- Get existing employee IDs or create sample ones
    SELECT id INTO emp1_id FROM employees LIMIT 1;
    
    IF emp1_id IS NULL THEN
        -- Create sample employees if none exist
        INSERT INTO employees (id, name, email, role, department, employment_type, joining_date, status, base_salary, currency)
        VALUES 
            (gen_random_uuid(), 'John Doe', 'john.doe@company.com', 'Software Engineer', 'Engineering', 'full_time', '2024-01-15', 'active', 5000, 'USD'),
            (gen_random_uuid(), 'Jane Smith', 'jane.smith@company.com', 'Product Manager', 'Product', 'full_time', '2024-02-01', 'active', 6000, 'USD'),
            (gen_random_uuid(), 'Mike Johnson', 'mike.johnson@company.com', 'Designer', 'Design', 'full_time', '2024-03-01', 'active', 4500, 'USD')
        RETURNING id INTO emp1_id;
        
        SELECT id INTO emp2_id FROM employees WHERE name = 'Jane Smith';
        SELECT id INTO emp3_id FROM employees WHERE name = 'Mike Johnson';
    ELSE
        -- Use existing employees
        SELECT id INTO emp2_id FROM employees OFFSET 1 LIMIT 1;
        SELECT id INTO emp3_id FROM employees OFFSET 2 LIMIT 1;
        
        -- If we don't have enough employees, use the first one for all
        IF emp2_id IS NULL THEN emp2_id := emp1_id; END IF;
        IF emp3_id IS NULL THEN emp3_id := emp1_id; END IF;
    END IF;

    -- Clear existing sample data
    DELETE FROM payment_history WHERE notes LIKE '%Sample%' OR notes LIKE '%Test%';
    DELETE FROM payment_schedules WHERE employee_name LIKE '%Sample%';
    DELETE FROM payment_approvals WHERE employee_name LIKE '%Sample%';

    -- Insert sample payment history
    INSERT INTO payment_history (
        employee_id, employee_name, department, amount, currency, 
        payment_method, status, payment_date, processed_at, 
        transaction_id, notes
    ) VALUES 
        (emp1_id, 'John Doe', 'Engineering', 5000, 'USD', 'bank_transfer', 'paid', '2024-12-01', NOW(), 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)), 'Sample monthly salary payment'),
        (emp2_id, 'Jane Smith', 'Product', 6000, 'USD', 'bank_transfer', 'paid', '2024-12-01', NOW(), 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)), 'Sample monthly salary payment'),
        (emp3_id, 'Mike Johnson', 'Design', 4500, 'USD', 'bank_transfer', 'paid', '2024-12-01', NOW(), 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)), 'Sample monthly salary payment'),
        (emp1_id, 'John Doe', 'Engineering', 5000, 'USD', 'bank_transfer', 'pending', '2024-12-15', NULL, NULL, 'Sample pending payment'),
        (emp2_id, 'Jane Smith', 'Product', 6000, 'USD', 'digital_wallet', 'approved', '2024-12-15', NULL, NULL, 'Sample approved payment'),
        (emp3_id, 'Mike Johnson', 'Design', 4500, 'USD', 'check', 'failed', '2024-11-30', NOW(), 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)), 'Sample failed payment - retry needed'),
        (emp1_id, 'John Doe', 'Engineering', 5200, 'USD', 'bank_transfer', 'paid', '2024-11-01', NOW() - INTERVAL '30 days', 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)), 'Sample November salary'),
        (emp2_id, 'Jane Smith', 'Product', 6200, 'USD', 'bank_transfer', 'paid', '2024-11-01', NOW() - INTERVAL '30 days', 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)), 'Sample November salary'),
        (emp1_id, 'John Doe', 'Engineering', 500, 'USD', 'cash', 'paid', '2024-12-05', NOW(), 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)), 'Sample bonus payment');

    -- Insert sample payment schedules
    INSERT INTO payment_schedules (
        employee_id, employee_name, department, amount, currency, 
        scheduled_date, frequency, status
    ) VALUES 
        (emp1_id, 'John Doe', 'Engineering', 5000, 'USD', '2025-01-01', 'monthly', 'scheduled'),
        (emp2_id, 'Jane Smith', 'Product', 6000, 'USD', '2025-01-01', 'monthly', 'scheduled'),
        (emp3_id, 'Mike Johnson', 'Design', 4500, 'USD', '2025-01-01', 'monthly', 'scheduled'),
        (emp1_id, 'John Doe', 'Engineering', 5000, 'USD', '2025-01-15', 'monthly', 'pending_approval'),
        (emp2_id, 'Jane Smith', 'Product', 6000, 'USD', '2025-01-15', 'monthly', 'approved'),
        (emp3_id, 'Mike Johnson', 'Design', 4500, 'USD', '2025-02-01', 'monthly', 'scheduled');

    -- Insert sample payment approvals
    INSERT INTO payment_approvals (
        employee_id, employee_name, amount, currency, status, 
        requested_by, comments
    ) VALUES 
        (emp1_id, 'John Doe', 5000, 'USD', 'pending', 'HR Manager', 'Regular monthly salary approval needed'),
        (emp2_id, 'Jane Smith', 1000, 'USD', 'pending', 'Finance Team', 'Performance bonus approval required'),
        (emp3_id, 'Mike Johnson', 4500, 'USD', 'approved', 'HR Manager', 'Approved for regular payment');

    RAISE NOTICE 'Sample payment data inserted successfully';
END $$;