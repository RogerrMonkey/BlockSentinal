-- Add detected_by column to findings table to track which analyzer found each vulnerability
-- This helps users understand which tools (Slither, Mythril, AI) detected each issue

ALTER TABLE findings 
ADD COLUMN IF NOT EXISTS detected_by VARCHAR(100);

-- Add comment to the column
COMMENT ON COLUMN findings.detected_by IS 'Analyzer that detected this vulnerability (e.g., slither, mythril, ai-gpt4, multiple (slither, mythril))';

-- Update existing findings to have a default source (if any exist)
UPDATE findings 
SET detected_by = 'slither' 
WHERE detected_by IS NULL;
