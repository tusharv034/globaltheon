-- Allow affiliates to view their level 2 downline (affiliates sponsored by their direct affiliates)
CREATE POLICY "Affiliates can view their level 2 downline"
ON public.affiliates
FOR SELECT
USING (
  is_affiliate(auth.uid())
  AND enrolled_by IN (
    SELECT a1.id
    FROM public.affiliates a1
    WHERE a1.enrolled_by = get_affiliate_id_for_user(auth.uid())
  )
);

-- Allow affiliates to view customers sponsored by their level 2 affiliates (third-level customers)
CREATE POLICY "Affiliates can view their level 2 affiliates' customers"
ON public.customers
FOR SELECT
USING (
  is_affiliate(auth.uid())
  AND enrolled_by IN (
    SELECT l2.id
    FROM public.affiliates l2
    WHERE l2.enrolled_by IN (
      SELECT l1.id
      FROM public.affiliates l1
      WHERE l1.enrolled_by = get_affiliate_id_for_user(auth.uid())
    )
  )
);

-- Allow affiliates to view orders from customers of their level 2 affiliates
CREATE POLICY "Affiliates can view orders from Level 2 affiliates' customers"
ON public.orders
FOR SELECT
USING (
  is_affiliate(auth.uid())
  AND customer_id IN (
    SELECT c.id
    FROM public.customers c
    JOIN public.affiliates l2 ON c.enrolled_by = l2.id
    JOIN public.affiliates l1 ON l2.enrolled_by = l1.id
    WHERE l1.enrolled_by = get_affiliate_id_for_user(auth.uid())
  )
);
