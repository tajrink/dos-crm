-- Add missing columns to invoice_templates table
-- These columns are required by the TemplateEditor component and pdfGenerator

-- Add secondary_color column
ALTER TABLE invoice_templates 
ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#6B7280';

-- Add logo_url column  
ALTER TABLE invoice_templates 
ADD COLUMN logo_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN invoice_templates.secondary_color IS 'Secondary color for invoice template styling';
COMMENT ON COLUMN invoice_templates.logo_url IS 'URL or data URI for company logo in invoice templates';