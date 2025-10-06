-- CRM Enhancements Migration
-- Enhancement 1: Client Reference Fields
-- Enhancement 2: Project Work Scope Fields  
-- Enhancement 3: Invoice Template Management System

-- Enhancement 1: Add reference fields to clients table
ALTER TABLE clients ADD COLUMN reference_source VARCHAR(255);
ALTER TABLE clients ADD COLUMN reference_details TEXT;

-- Enhancement 2: Add work scope fields to projects table (deliverables already exists)
ALTER TABLE projects ADD COLUMN work_scope TEXT;
ALTER TABLE projects ADD COLUMN scope_approved BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN scope_approved_date TIMESTAMP WITH TIME ZONE;

-- Enhancement 3: Create invoice_templates table
CREATE TABLE invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  company_logo_url TEXT,
  company_name VARCHAR(255),
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  company_website VARCHAR(255),
  tax_number VARCHAR(100),
  theme_color VARCHAR(7) DEFAULT '#3B82F6',
  layout_style VARCHAR(50) DEFAULT 'modern',
  header_style JSONB,
  footer_text TEXT,
  terms_conditions TEXT,
  payment_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add template reference to invoices
ALTER TABLE invoices ADD COLUMN template_id UUID REFERENCES invoice_templates(id);

-- Create default template
INSERT INTO invoice_templates (name, is_default, company_name, company_address, company_email, company_phone) 
VALUES (
  'Default Template', 
  true, 
  'Devs On Steroids',
  '123 Tech Street, Innovation City, IC 12345',
  'contact@devsonsteroids.com',
  '+1 (555) 123-4567'
);

-- Enable RLS on invoice_templates
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

-- Grant permissions for invoice_templates
GRANT ALL PRIVILEGES ON invoice_templates TO authenticated;
GRANT SELECT ON invoice_templates TO anon;

-- Create RLS policies for invoice_templates
CREATE POLICY "Enable all operations for authenticated users" ON invoice_templates
  FOR ALL USING (true);

CREATE POLICY "Enable read access for anon users" ON invoice_templates
  FOR SELECT USING (true);