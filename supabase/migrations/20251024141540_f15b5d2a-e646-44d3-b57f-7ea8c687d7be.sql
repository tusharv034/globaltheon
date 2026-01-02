-- Update commission rates to correct values and normalize to decimal format
-- Convert old 10% (0.10) Level 1 commissions to current 25% (0.25)
UPDATE order_commissions
SET commission_rate = 0.25
WHERE commission_rate = 0.10;

-- Normalize any whole number percentages to decimals
-- Convert 25 to 0.25 (Level 1)
UPDATE order_commissions
SET commission_rate = 0.25
WHERE commission_rate = 25;

-- Convert 12 to 0.12 (Level 2)
UPDATE order_commissions
SET commission_rate = 0.12
WHERE commission_rate = 12;

-- Add a comment to document the standard rates
COMMENT ON COLUMN order_commissions.commission_rate IS 'Commission rate stored as decimal (0.25 = 25%, 0.12 = 12%)';