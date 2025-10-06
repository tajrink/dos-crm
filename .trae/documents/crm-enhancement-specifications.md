# CRM Enhancement Specifications

## Enhancement 1: Client Reference Field

### Overview
Add a reference field to client management to track how clients were acquired or referred to the business.

### Database Schema Changes
```sql
-- Add reference column to clients table
ALTER TABLE clients ADD COLUMN reference_source VARCHAR(255);
ALTER TABLE clients ADD COLUMN reference_details TEXT;
```

### UI/UX Implementation
- **Location**: Client creation and editing modals
- **Field Type**: Dropdown with custom input option
- **Options**: 
  - Referral (existing client)
  - Social Media
  - Website
  - Cold Outreach
  - Networking Event
  - Partner/Agency
  - Direct Contact
  - Other (with text input)
- **Additional Field**: Reference details (optional text area for specifics)

### Technical Implementation
- Update ClientModal component with new form fields
- Add validation for reference source
- Update client types in TypeScript definitions
- Modify Supabase queries to include reference fields

---

## Enhancement 2: Project Work Scope Field

### Overview
Add a comprehensive work scope field to project management for detailed project scope definition and deliverables tracking.

### Database Schema Changes
```sql
-- Add work scope columns to projects table
ALTER TABLE projects ADD COLUMN work_scope TEXT;
ALTER TABLE projects ADD COLUMN deliverables JSONB;
ALTER TABLE projects ADD COLUMN scope_approved BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN scope_approved_date TIMESTAMP;
```

### UI/UX Implementation
- **Location**: Project creation and editing modals
- **Field Type**: Rich text editor with structured sections
- **Sections**:
  - Project Overview
  - Detailed Scope of Work
  - Deliverables Checklist
  - Technical Requirements
  - Timeline & Milestones
  - Exclusions/Out of Scope
- **Features**:
  - Markdown support
  - Template library for common project types
  - Scope approval workflow
  - Version history tracking

### Technical Implementation
- Integrate rich text editor (e.g., TipTap or React-Quill)
- Create scope templates system
- Add approval workflow functionality
- Update project types and validation
- Implement scope change tracking

---

## Enhancement 3: Invoice Template Management System

### Overview
Create a comprehensive invoice template management system with customizable branding, layouts, and professional invoice generation.

### Database Schema Changes
```sql
-- Create invoice_templates table
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
INSERT INTO invoice_templates (name, is_default, company_name) 
VALUES ('Default Template', true, 'Devs On Steroids');
```

### UI/UX Implementation

#### Template Management Tab
- **Location**: New tab in Invoice Management section
- **Features**:
  - Template library with preview thumbnails
  - Create/Edit/Delete templates
  - Set default template
  - Template duplication
  - Import/Export templates

#### Template Editor Interface
- **Company Branding Section**:
  - Logo upload with drag-drop
  - Company information form
  - Address builder with multiple formats
  - Contact details management
  
- **Design Customization**:
  - Theme color picker
  - Layout style selection (Modern, Classic, Minimal, Corporate)
  - Header/Footer customization
  - Font selection
  - Color scheme options

- **Content Configuration**:
  - Terms & conditions editor
  - Payment instructions
  - Footer text customization
  - Tax information setup

#### Live Preview System
- **Real-time Preview**: Show invoice preview as user edits
- **Sample Data**: Use placeholder data for preview
- **Responsive Preview**: Show how invoice looks on different sizes
- **PDF Preview**: Generate actual PDF preview

### Technical Implementation

#### Frontend Components
```typescript
// New components to create:
- InvoiceTemplateManager.tsx
- TemplateEditor.tsx
- TemplatePreview.tsx
- LogoUploader.tsx
- ColorPicker.tsx
- LayoutSelector.tsx
```

#### Backend Integration
- File upload handling for logos (Supabase Storage)
- Template CRUD operations
- PDF generation with custom templates
- Template validation and sanitization

#### PDF Generation Enhancement
- Upgrade jsPDF implementation with template support
- Dynamic layout rendering based on template settings
- Logo embedding and positioning
- Custom styling application
- Professional formatting with company branding

### Implementation Priority
1. **Phase 1**: Database schema updates and basic template CRUD
2. **Phase 2**: Template editor interface with basic customization
3. **Phase 3**: Advanced design options and live preview
4. **Phase 4**: PDF generation integration and testing

### User Experience Flow
1. User navigates to Invoice Management → Templates tab
2. Creates new template or edits existing one
3. Uploads company logo and fills company details
4. Customizes design elements and layout
5. Previews template with sample data
6. Saves template and sets as default if desired
7. When creating invoices, template is automatically applied
8. Generated PDFs reflect the custom branding and layout

This enhancement will provide professional, branded invoices that reflect the company's identity and improve client perception of the business.