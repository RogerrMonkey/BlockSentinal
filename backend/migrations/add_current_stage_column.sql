-- Migration: Add current_stage column to scans table
-- Date: 2025-12-05
-- Description: Adds current_stage column to track which analysis step is currently running

ALTER TABLE scans ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50);

-- Create index for faster queries on current_stage
CREATE INDEX IF NOT EXISTS idx_scans_current_stage ON scans(current_stage);

-- Update existing scans based on their status
UPDATE scans 
SET current_stage = CASE 
    WHEN status = 'pending' THEN NULL
    WHEN status = 'running' THEN 'init'
    WHEN status = 'completed' THEN 'report'
    WHEN status = 'failed' THEN NULL
    ELSE NULL
END
WHERE current_stage IS NULL;
