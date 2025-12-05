-- BlockSentinel Database Schema for Supabase
-- This script initializes the database tables and indexes

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Scans table
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    contract_address VARCHAR(42),
    scan_type VARCHAR(20) NOT NULL DEFAULT 'full',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    source_code TEXT,
    report_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Findings table
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(50),
    confidence VARCHAR(20),
    line_number INTEGER,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_scan_id ON findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);

-- Create a view for scan summaries (optional, useful for dashboards)
CREATE OR REPLACE VIEW scan_summaries AS
SELECT 
    s.id,
    s.contract_address,
    s.status,
    s.created_at,
    s.completed_at,
    u.wallet_address,
    COUNT(f.id) as total_findings,
    COUNT(CASE WHEN f.severity = 'critical' THEN 1 END) as critical_count,
    COUNT(CASE WHEN f.severity = 'high' THEN 1 END) as high_count,
    COUNT(CASE WHEN f.severity = 'medium' THEN 1 END) as medium_count,
    COUNT(CASE WHEN f.severity = 'low' THEN 1 END) as low_count
FROM scans s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN findings f ON s.id = f.scan_id
GROUP BY s.id, s.contract_address, s.status, s.created_at, s.completed_at, u.wallet_address;

-- Grant permissions (Supabase handles this, but good practice)
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- Insert a test user (optional - remove in production)
-- INSERT INTO users (wallet_address) 
-- VALUES ('0x0000000000000000000000000000000000000000')
-- ON CONFLICT (wallet_address) DO NOTHING;

COMMENT ON TABLE users IS 'Registered users with wallet addresses';
COMMENT ON TABLE scans IS 'Smart contract security scans';
COMMENT ON TABLE findings IS 'Security vulnerabilities found in scans';
