-- Add budget column to projects table
-- This column is required by the ProjectModal component and project management functionality

-- Add budget column
ALTER TABLE projects 
ADD COLUMN budget NUMERIC(12,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN projects.budget IS 'Project budget amount';