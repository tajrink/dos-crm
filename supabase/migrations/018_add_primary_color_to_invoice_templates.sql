-- Add missing primary_color column to invoice_templates table
-- This column is required by the TemplateEditor component and pdfGenerator

-- Add primary_color column (rename theme_color to primary_color for consistency)
ALTER TABLE invoice_templates 
ADD COLUMN primary_color VARCHAR(7) DEFAULT '#3B82F6';

-- Copy existing theme_color values to primary_color
UPDATE invoice_templates 
SET primary_color = theme_color 
WHERE theme_color IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN invoice_templates.primary_color IS 'Primary color for invoice template styling';