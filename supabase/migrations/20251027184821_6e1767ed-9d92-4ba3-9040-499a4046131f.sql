-- Add phone_numbers JSONB column to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS phone_numbers jsonb DEFAULT '[]'::jsonb;

-- Add phone_numbers JSONB column to affiliates table
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS phone_numbers jsonb DEFAULT '[]'::jsonb;

-- Migrate existing phone data to new structure for customers
UPDATE public.customers
SET phone_numbers = jsonb_build_array(
  jsonb_build_object(
    'type', 'mobile',
    'number', phone,
    'is_primary', true
  )
)
WHERE phone IS NOT NULL AND phone != '' AND (phone_numbers = '[]'::jsonb OR phone_numbers IS NULL);

-- Migrate existing phone data to new structure for affiliates
UPDATE public.affiliates
SET phone_numbers = jsonb_build_array(
  jsonb_build_object(
    'type', 'mobile',
    'number', phone,
    'is_primary', true
  )
)
WHERE phone IS NOT NULL AND phone != '' AND (phone_numbers = '[]'::jsonb OR phone_numbers IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone_numbers ON public.customers USING gin(phone_numbers);
CREATE INDEX IF NOT EXISTS idx_affiliates_phone_numbers ON public.affiliates USING gin(phone_numbers);