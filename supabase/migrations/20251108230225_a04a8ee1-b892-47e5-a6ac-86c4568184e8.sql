-- Add deleted_by column to customers, affiliates, and orders tables
ALTER TABLE public.customers ADD COLUMN deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;
ALTER TABLE public.affiliates ADD COLUMN deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Add indexes for efficient filtering
CREATE INDEX idx_customers_deleted_by ON public.customers(deleted_by) WHERE deleted_by IS NOT NULL;
CREATE INDEX idx_affiliates_deleted_by ON public.affiliates(deleted_by) WHERE deleted_by IS NOT NULL;
CREATE INDEX idx_orders_deleted_by ON public.orders(deleted_by) WHERE deleted_by IS NOT NULL;