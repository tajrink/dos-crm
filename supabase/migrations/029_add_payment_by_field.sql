-- Add payment_by field to payroll_records table
-- This field will store who processed the payment (TroubleShooter, TJ, Admin, etc.)

ALTER TABLE payroll_records 
ADD COLUMN payment_by VARCHAR(100);

-- Update existing records to have a default value
UPDATE payroll_records 
SET payment_by = 'Admin' 
WHERE payment_by IS NULL;

-- Add comment for the new column
COMMENT ON COLUMN payroll_records.payment_by IS 'Person who processed the payment (TroubleShooter, TJ, Admin, etc.)';