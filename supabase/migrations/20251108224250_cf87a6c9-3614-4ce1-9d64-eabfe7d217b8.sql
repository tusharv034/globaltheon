-- Add shipping and billing address fields to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address_line1 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address_line2 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_country TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_address_line1 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_address_line2 TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_state TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_postal_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_country TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_same_as_shipping BOOLEAN DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN public.orders.shipping_address_line1 IS 'Shipping address line 1 (street address)';
COMMENT ON COLUMN public.orders.shipping_address_line2 IS 'Shipping address line 2 (apt, suite, etc.)';
COMMENT ON COLUMN public.orders.billing_same_as_shipping IS 'True if billing address is same as shipping address';