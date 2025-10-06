-- Add foreign key constraint for team_requests.assignee_id to reference employees.id
ALTER TABLE team_requests 
ADD CONSTRAINT team_requests_assignee_id_fkey 
FOREIGN KEY (assignee_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- Add comment to document the relationship
COMMENT ON COLUMN team_requests.assignee_id IS 'Foreign key reference to employees.id for the assigned employee';