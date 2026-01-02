-- Add email opt-out fields to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS email_opted_out boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS email_opted_out_at timestamp with time zone;

-- Add email opt-out fields to affiliates table
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS email_opted_out boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS email_opted_out_at timestamp with time zone;

-- Add index for faster lookups of opted-out users
CREATE INDEX IF NOT EXISTS idx_customers_email_opted_out ON public.customers(email_opted_out) WHERE email_opted_out = true;
CREATE INDEX IF NOT EXISTS idx_affiliates_email_opted_out ON public.affiliates(email_opted_out) WHERE email_opted_out = true;