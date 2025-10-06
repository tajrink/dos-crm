-- Add missing header_text column to invoice_templates table
-- This column is required by the TemplateEditor component and pdfGenerator

ALTER TABLE invoice_templates 
ADD COLUMN header_text TEXT;

-- Add comment for documentation
COMMENT ON COLUMN invoice_templates.header_text IS 'Custom header text for invoice templates';