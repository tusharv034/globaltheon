-- Add deleted_at column to customers, affiliates, and orders tables for soft delete functionality
ALTER TABLE public.customers ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.affiliates ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes on deleted_at for efficient filtering
CREATE INDEX idx_customers_deleted_at ON public.customers(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_affiliates_deleted_at ON public.affiliates(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_orders_deleted_at ON public.orders(deleted_at) WHERE deleted_at IS NOT NULL;

-- Update existing RLS policies to exclude soft-deleted records from normal views
-- Drop existing SELECT policies and recreate with deleted_at filter
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
CREATE POLICY "Admins can view all customers"
ON public.customers
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins can view all affiliates" ON public.affiliates;
CREATE POLICY "Admins can view all affiliates"
ON public.affiliates
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()) AND deleted_at IS NULL);

-- Create new policies for viewing deleted records (admin only)
CREATE POLICY "Admins can view deleted customers"
ON public.customers
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()) AND deleted_at IS NOT NULL);

CREATE POLICY "Admins can view deleted affiliates"
ON public.affiliates
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()) AND deleted_at IS NOT NULL);

CREATE POLICY "Admins can view deleted orders"
ON public.orders
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()) AND deleted_at IS NOT NULL);