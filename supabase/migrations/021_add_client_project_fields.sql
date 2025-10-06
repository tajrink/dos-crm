-- Add project-related budget and timeline fields to clients table
-- These fields will track project budgets and timelines at the client level

ALTER TABLE clients 
ADD COLUMN proposed_budget NUMERIC(12,2) DEFAULT 0,
ADD COLUMN approved_budget NUMERIC(12,2) DEFAULT 0,
ADD COLUMN probable_start_date DATE,
ADD COLUMN probable_end_date DATE,
ADD COLUMN actual_start_date DATE,
ADD COLUMN actual_end_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN clients.proposed_budget IS 'Proposed budget for client project';
COMMENT ON COLUMN clients.approved_budget IS 'Approved budget for client project';
COMMENT ON COLUMN clients.probable_start_date IS 'Probable start date for client project';
COMMENT ON COLUMN clients.probable_end_date IS 'Probable end date for client project';
COMMENT ON COLUMN clients.actual_start_date IS 'Actual start date for client project';
COMMENT ON COLUMN clients.actual_end_date IS 'Actual end date for client project';