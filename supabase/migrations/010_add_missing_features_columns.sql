-- Add missing columns to features_catalog table
ALTER TABLE features_catalog 
ADD COLUMN base_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN time_estimate DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN complexity VARCHAR(20) DEFAULT 'medium' CHECK (complexity IN ('simple', 'medium', 'complex')),
ADD COLUMN tags JSONB DEFAULT '[]';

-- Update existing records with default values
UPDATE features_catalog SET 
  base_price = CASE 
    WHEN category = 'Development' THEN 2500.00
    WHEN category = 'Design' THEN 1500.00
    WHEN category = 'Mobile' THEN 3500.00
    WHEN category = 'E-comm' THEN 2000.00
    WHEN category = 'GVI' THEN 800.00
    WHEN category = 'Creative' THEN 1200.00
    WHEN category = 'Marketplace' THEN 3000.00
    ELSE 1000.00
  END,
  time_estimate = CASE 
    WHEN category = 'Development' THEN 40.0
    WHEN category = 'Design' THEN 24.0
    WHEN category = 'Mobile' THEN 60.0
    WHEN category = 'E-comm' THEN 32.0
    WHEN category = 'GVI' THEN 16.0
    WHEN category = 'Creative' THEN 20.0
    WHEN category = 'Marketplace' THEN 48.0
    ELSE 20.0
  END,
  complexity = CASE 
    WHEN category IN ('Mobile', 'Marketplace') THEN 'complex'
    WHEN category IN ('Development', 'E-comm') THEN 'medium'
    ELSE 'simple'
  END,
  tags = CASE 
    WHEN category = 'Development' THEN '["backend", "api", "database"]'
    WHEN category = 'Design' THEN '["ui", "ux", "figma"]'
    WHEN category = 'Mobile' THEN '["react-native", "ios", "android"]'
    WHEN category = 'E-comm' THEN '["payment", "stripe", "commerce"]'
    WHEN category = 'GVI' THEN '["graphics", "video", "animation"]'
    WHEN category = 'Creative' THEN '["branding", "logo", "identity"]'
    WHEN category = 'Marketplace' THEN '["vendor", "commission", "dashboard"]'
    ELSE '["general"]'
  END::jsonb
WHERE base_price IS NULL OR base_price = 0;

-- Create indexes for new columns
CREATE INDEX idx_features_base_price ON features_catalog(base_price);
CREATE INDEX idx_features_complexity ON features_catalog(complexity);