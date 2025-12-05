-- Add network column to scans table for Sepolia testnet support
-- Run this migration on existing Supabase database

-- Add network column (defaults to mainnet for backward compatibility)
ALTER TABLE scans 
ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'mainnet';

-- Add index for faster filtering by network
CREATE INDEX IF NOT EXISTS idx_scans_network ON scans(network);

-- Update existing records to have 'mainnet' explicitly set
UPDATE scans 
SET network = 'mainnet' 
WHERE network IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN scans.network IS 'Ethereum network: mainnet or sepolia';
