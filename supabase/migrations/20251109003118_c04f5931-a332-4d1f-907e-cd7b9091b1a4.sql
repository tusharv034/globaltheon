-- Fix infinite recursion in affiliates RLS policies
-- The issue is that "Affiliates can view their downline" policy queries the affiliates table
-- within its USING clause, causing infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Affiliates can view their downline" ON public.affiliates;

-- Recreate it using a SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_affiliate_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.affiliates WHERE auth_user_id = _user_id LIMIT 1;
$$;

-- Recreate the policy using the SECURITY DEFINER function
CREATE POLICY "Affiliates can view their downline" 
ON public.affiliates 
FOR SELECT 
TO authenticated
USING (
  is_affiliate(auth.uid()) 
  AND enrolled_by = get_affiliate_id_for_user(auth.uid())
);