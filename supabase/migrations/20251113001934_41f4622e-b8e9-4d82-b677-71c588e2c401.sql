
-- Add RLS policy to allow affiliates to view customers enrolled by their downline affiliates
CREATE POLICY "Affiliates can view their downline's customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  is_affiliate(auth.uid()) 
  AND enrolled_by IN (
    -- Get affiliates that this affiliate enrolled (their downline)
    SELECT id
    FROM affiliates
    WHERE enrolled_by = (
      SELECT id FROM affiliates WHERE auth_user_id = auth.uid()
    )
  )
);
