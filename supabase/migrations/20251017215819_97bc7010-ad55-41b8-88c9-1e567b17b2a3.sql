-- Remove customer_type column from customers table
ALTER TABLE public.customers DROP COLUMN IF EXISTS customer_type;