-- Add missing columns to clients table
-- These columns are required by the ClientModal component

-- Add phone column
ALTER TABLE clients 
ADD COLUMN phone VARCHAR(20);

-- Add address column  
ALTER TABLE clients 
ADD COLUMN address TEXT;

-- Add comments for documentation
COMMENT ON COLUMN clients.phone IS 'Client phone number';
COMMENT ON COLUMN clients.address IS 'Client physical address';