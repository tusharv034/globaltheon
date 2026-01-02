-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Affiliates can view their level 2 downline" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can view their level 2 affiliates' customers" ON public.customers;
DROP POLICY IF EXISTS "Affiliates can view orders from Level 2 affiliates' customers" ON public.orders;

-- Create security definer function to get level 1 affiliate IDs for a user
CREATE OR REPLACE FUNCTION public.get_level1_affiliate_ids(_user_id uuid)
RETURNS TABLE(affiliate_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id 
  FROM public.affiliates
  WHERE enrolled_by = (
    SELECT id 
    FROM public.affiliates 
    WHERE auth_user_id = _user_id
    LIMIT 1
  )
  AND deleted_at IS NULL;
$$;

-- Create security definer function to get level 2 affiliate IDs for a user
CREATE OR REPLACE FUNCTION public.get_level2_affiliate_ids(_user_id uuid)
RETURNS TABLE(affiliate_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT a2.id 
  FROM public.affiliates a2
  WHERE a2.enrolled_by IN (
    SELECT a1.id 
    FROM public.affiliates a1
    WHERE a1.enrolled_by = (
      SELECT a0.id 
      FROM public.affiliates a0 
      WHERE a0.auth_user_id = _user_id
      LIMIT 1
    )
    AND a1.deleted_at IS NULL
  )
  AND a2.deleted_at IS NULL;
$$;

-- Create security definer function to get level 2 affiliate customer IDs
CREATE OR REPLACE FUNCTION public.get_level2_affiliate_customer_ids(_user_id uuid)
RETURNS TABLE(customer_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id
  FROM public.customers c
  WHERE c.enrolled_by IN (
    SELECT affiliate_id FROM public.get_level2_affiliate_ids(_user_id)
  )
  AND c.deleted_at IS NULL;
$$;

-- Now create the policies using these functions (no recursion)
CREATE POLICY "Affiliates can view their level 2 downline"
ON public.affiliates
FOR SELECT
USING (
  is_affiliate(auth.uid())
  AND id IN (SELECT affiliate_id FROM public.get_level2_affiliate_ids(auth.uid()))
);

CREATE POLICY "Affiliates can view their level 2 affiliates' customers"
ON public.customers
FOR SELECT
USING (
  is_affiliate(auth.uid())
  AND id IN (SELECT customer_id FROM public.get_level2_affiliate_customer_ids(auth.uid()))
);

CREATE POLICY "Affiliates can view orders from Level 2 affiliates' customers"
ON public.orders
FOR SELECT
USING (
  is_affiliate(auth.uid())
  AND customer_id IN (SELECT customer_id FROM public.get_level2_affiliate_customer_ids(auth.uid()))
);
