-- Add missing columns to invoices table
ALTER TABLE invoices 
ADD COLUMN project_id UUID REFERENCES projects(id),
ADD COLUMN issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN notes TEXT;

-- Create index for the new foreign key
CREATE INDEX idx_invoices_project_id ON invoices(project_id);

-- Update existing invoices to have issue_date if they don't have one
UPDATE invoices SET issue_date = created_at::date WHERE issue_date IS NULL;