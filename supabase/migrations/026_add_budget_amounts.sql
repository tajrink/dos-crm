-- Add budget amount columns to budget_categories table
ALTER TABLE budget_categories 
ADD COLUMN IF NOT EXISTS annual_budget NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12,2) DEFAULT 0;

-- Update existing categories with sample budget data
UPDATE budget_categories SET 
  annual_budget = 50000,
  monthly_budget = 4166.67
WHERE name = 'Development';

UPDATE budget_categories SET 
  annual_budget = 30000,
  monthly_budget = 2500
WHERE name = 'Marketing';

UPDATE budget_categories SET 
  annual_budget = 15000,
  monthly_budget = 1250
WHERE name = 'Hardware';

UPDATE budget_categories SET 
  annual_budget = 8000,
  monthly_budget = 666.67
WHERE name = 'Office Supplies';

UPDATE budget_categories SET 
  annual_budget = 25000,
  monthly_budget = 2083.33
WHERE name = 'Operations';

UPDATE budget_categories SET 
  annual_budget = 20000,
  monthly_budget = 1666.67
WHERE name = 'Professional Services';

UPDATE budget_categories SET 
  annual_budget = 35000,
  monthly_budget = 2916.67
WHERE name = 'Research & Development';

UPDATE budget_categories SET 
  annual_budget = 120000,
  monthly_budget = 10000
WHERE name = 'Salaries';

UPDATE budget_categories SET 
  annual_budget = 12000,
  monthly_budget = 1000
WHERE name = 'Software Licenses';

UPDATE budget_categories SET 
  annual_budget = 10000,
  monthly_budget = 833.33
WHERE name = 'Training';

UPDATE budget_categories SET 
  annual_budget = 18000,
  monthly_budget = 1500
WHERE name = 'Travel';

UPDATE budget_categories SET 
  annual_budget = 24000,
  monthly_budget = 2000
WHERE name = 'Utilities';

-- Add comment to document the columns
COMMENT ON COLUMN budget_categories.annual_budget IS 'Annual budget allocation for this category';
COMMENT ON COLUMN budget_categories.monthly_budget IS 'Monthly budget allocation for this category';