-- Add email column to clients table
ALTER TABLE clients ADD COLUMN email VARCHAR(255);

-- Create index on email for better performance
CREATE INDEX idx_clients_email ON clients(email);

-- Update existing records with sample email addresses
UPDATE clients SET email = name || '@example.com' WHERE email IS NULL;