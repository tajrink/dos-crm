-- Add priority column to projects table
-- This column stores the priority level of each project

ALTER TABLE projects 
ADD COLUMN priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add comment to describe the column
COMMENT ON COLUMN projects.priority IS 'Priority level of the project (low, medium, high, urgent)';