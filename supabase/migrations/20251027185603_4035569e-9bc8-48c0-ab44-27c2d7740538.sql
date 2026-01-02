-- Add tax_id column to affiliates table
ALTER TABLE public.affiliates 
ADD COLUMN tax_id text;

-- Add index for tax_id lookups
CREATE INDEX idx_affiliates_tax_id ON public.affiliates(tax_id);

-- Add comment to document the column
COMMENT ON COLUMN public.affiliates.tax_id IS 'Tax identification number for the affiliate';