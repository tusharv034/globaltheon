
-- Add RLS policy to allow affiliates to view orders from their downline's customers
-- This allows affiliates to see orders from customers enrolled by affiliates they enrolled
CREATE POLICY "Affiliates can view their downline customers' orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) 
  AND customer_id IN (
    -- Get customers enrolled by affiliates that this affiliate enrolled
    SELECT c.id
    FROM customers c
    JOIN affiliates downline_aff ON c.enrolled_by = downline_aff.id
    JOIN affiliates upline_aff ON downline_aff.enrolled_by = upline_aff.id
    WHERE upline_aff.auth_user_id = auth.uid()
  )
);
