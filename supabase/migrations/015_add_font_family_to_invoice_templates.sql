-- Add missing font_family column to invoice_templates table
-- This column is required by the TemplateEditor component

ALTER TABLE invoice_templates 
ADD COLUMN font_family VARCHAR(50) DEFAULT 'Inter' NOT NULL;

-- Add a check constraint to ensure only valid font families are used
ALTER TABLE invoice_templates 
ADD CONSTRAINT check_font_family 
CHECK (font_family IN ('Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Roboto'));

-- Update any existing records to have the default font family
UPDATE invoice_templates 
SET font_family = 'Inter' 
WHERE font_family IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN invoice_templates.font_family IS 'Font family for invoice template styling';