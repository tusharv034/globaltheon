-- Create is_affiliate function
CREATE OR REPLACE FUNCTION public.is_affiliate(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'affiliate'
  )
$$;

-- Add auth_user_id column to affiliates table to link with auth.users
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_affiliates_auth_user_id ON public.affiliates(auth_user_id);

COMMENT ON COLUMN public.affiliates.auth_user_id IS 'Links affiliate to their auth user account for login access';

-- Create RLS policy for affiliates to view their own profile
CREATE POLICY "Affiliates can view their own profile"
ON public.affiliates
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Create RLS policy for affiliates to view their downline affiliates
CREATE POLICY "Affiliates can view their downline"
ON public.affiliates
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) AND
  enrolled_by IN (
    SELECT id FROM public.affiliates WHERE auth_user_id = auth.uid()
  )
);

-- Create RLS policy for affiliates to view their own customers
CREATE POLICY "Affiliates can view their own customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) AND
  enrolled_by IN (
    SELECT id FROM public.affiliates WHERE auth_user_id = auth.uid()
  )
);

-- Create RLS policy for affiliates to view orders from their customers
CREATE POLICY "Affiliates can view their customers' orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) AND
  customer_id IN (
    SELECT c.id FROM public.customers c
    INNER JOIN public.affiliates a ON c.enrolled_by = a.id
    WHERE a.auth_user_id = auth.uid()
  )
);

-- Create RLS policy for affiliates to view their own commissions
CREATE POLICY "Affiliates can view their own commissions"
ON public.order_commissions
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) AND
  affiliate_id IN (
    SELECT id FROM public.affiliates WHERE auth_user_id = auth.uid()
  )
);

-- Create RLS policy for affiliates to view their own notes
CREATE POLICY "Affiliates can view their own notes"
ON public.affiliate_notes
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) AND
  affiliate_id IN (
    SELECT id FROM public.affiliates WHERE auth_user_id = auth.uid()
  )
);

-- Create RLS policy for affiliates to view their own customer notes
CREATE POLICY "Affiliates can view their customers' notes"
ON public.customer_notes
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) AND
  customer_id IN (
    SELECT c.id FROM public.customers c
    INNER JOIN public.affiliates a ON c.enrolled_by = a.id
    WHERE a.auth_user_id = auth.uid()
  )
);

-- Create RLS policy for affiliates to view order items from their customers' orders
CREATE POLICY "Affiliates can view their customers' order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) AND
  order_id IN (
    SELECT o.id FROM public.orders o
    INNER JOIN public.customers c ON o.customer_id = c.id
    INNER JOIN public.affiliates a ON c.enrolled_by = a.id
    WHERE a.auth_user_id = auth.uid()
  )
);

-- Allow affiliates to view commission periods
CREATE POLICY "Affiliates can view commission periods"
ON public.commission_periods
FOR SELECT
TO authenticated
USING (is_affiliate(auth.uid()));

-- Allow affiliates to view their own commission period adjustments
CREATE POLICY "Affiliates can view their own adjustments"
ON public.commission_period_adjustments
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) AND
  affiliate_id IN (
    SELECT id FROM public.affiliates WHERE auth_user_id = auth.uid()
  )
);

-- Allow affiliates to view order notes for their customers' orders
CREATE POLICY "Affiliates can view their customers' order notes"
ON public.order_notes
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) AND
  order_id IN (
    SELECT o.id FROM public.orders o
    INNER JOIN public.customers c ON o.customer_id = c.id
    INNER JOIN public.affiliates a ON c.enrolled_by = a.id
    WHERE a.auth_user_id = auth.uid()
  )
);