
-- Add tipalti_enabled column to affiliates table
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS tipalti_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN affiliates.tipalti_enabled IS 'Whether the affiliate has Tipalti payment integration enabled';
