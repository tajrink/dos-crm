-- Fix RLS Policies for HR System
-- This migration creates proper RLS policies for all HR tables

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON employees;

DROP POLICY IF EXISTS "Allow authenticated users to view payroll_records" ON payroll_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert payroll_records" ON payroll_records;
DROP POLICY IF EXISTS "Allow authenticated users to update payroll_records" ON payroll_records;
DROP POLICY IF EXISTS "Allow authenticated users to delete payroll_records" ON payroll_records;

DROP POLICY IF EXISTS "Allow authenticated users to view leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Allow authenticated users to insert leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Allow authenticated users to update leave_requests" ON leave_requests;
DROP POLICY IF EXISTS "Allow authenticated users to delete leave_requests" ON leave_requests;

DROP POLICY IF EXISTS "Allow authenticated users to view performance_reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Allow authenticated users to insert performance_reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Allow authenticated users to update performance_reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Allow authenticated users to delete performance_reviews" ON performance_reviews;

DROP POLICY IF EXISTS "Allow authenticated users to view employee_documents" ON employee_documents;
DROP POLICY IF EXISTS "Allow authenticated users to insert employee_documents" ON employee_documents;
DROP POLICY IF EXISTS "Allow authenticated users to update employee_documents" ON employee_documents;
DROP POLICY IF EXISTS "Allow authenticated users to delete employee_documents" ON employee_documents;

DROP POLICY IF EXISTS "Allow authenticated users to view salary_history" ON salary_history;
DROP POLICY IF EXISTS "Allow authenticated users to insert salary_history" ON salary_history;
DROP POLICY IF EXISTS "Allow authenticated users to update salary_history" ON salary_history;
DROP POLICY IF EXISTS "Allow authenticated users to delete salary_history" ON salary_history;

-- Create RLS policies for employees table
CREATE POLICY "Allow authenticated users to view employees" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert employees" ON employees
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update employees" ON employees
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete employees" ON employees
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for payroll_records table
CREATE POLICY "Allow authenticated users to view payroll_records" ON payroll_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert payroll_records" ON payroll_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update payroll_records" ON payroll_records
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete payroll_records" ON payroll_records
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for leave_requests table
CREATE POLICY "Allow authenticated users to view leave_requests" ON leave_requests
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert leave_requests" ON leave_requests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update leave_requests" ON leave_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete leave_requests" ON leave_requests
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for performance_reviews table
CREATE POLICY "Allow authenticated users to view performance_reviews" ON performance_reviews
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert performance_reviews" ON performance_reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update performance_reviews" ON performance_reviews
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete performance_reviews" ON performance_reviews
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for employee_documents table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employee_documents') THEN
        EXECUTE 'CREATE POLICY "Allow authenticated users to view employee_documents" ON employee_documents
            FOR SELECT USING (auth.role() = ''authenticated'')';
        
        EXECUTE 'CREATE POLICY "Allow authenticated users to insert employee_documents" ON employee_documents
            FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        
        EXECUTE 'CREATE POLICY "Allow authenticated users to update employee_documents" ON employee_documents
            FOR UPDATE USING (auth.role() = ''authenticated'')';
        
        EXECUTE 'CREATE POLICY "Allow authenticated users to delete employee_documents" ON employee_documents
            FOR DELETE USING (auth.role() = ''authenticated'')';
    END IF;
END
$$;

-- Create RLS policies for salary_history table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'salary_history') THEN
        EXECUTE 'CREATE POLICY "Allow authenticated users to view salary_history" ON salary_history
            FOR SELECT USING (auth.role() = ''authenticated'')';
        
        EXECUTE 'CREATE POLICY "Allow authenticated users to insert salary_history" ON salary_history
            FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
        
        EXECUTE 'CREATE POLICY "Allow authenticated users to update salary_history" ON salary_history
            FOR UPDATE USING (auth.role() = ''authenticated'')';
        
        EXECUTE 'CREATE POLICY "Allow authenticated users to delete salary_history" ON salary_history
            FOR DELETE USING (auth.role() = ''authenticated'')';
    END IF;
END
$$;

-- Ensure proper permissions are granted
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Allow anonymous users to view employees (for public access if needed)
GRANT SELECT ON employees TO anon;