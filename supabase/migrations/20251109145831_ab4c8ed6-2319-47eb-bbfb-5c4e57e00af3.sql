-- Create a function to check if enrolling affiliate has passed KYC
CREATE OR REPLACE FUNCTION public.check_enrolling_affiliate_kyc()
RETURNS TRIGGER AS $$
DECLARE
  enrolling_affiliate_kyc_pass BOOLEAN;
BEGIN
  -- Only check if enrolled_by is not null
  IF NEW.enrolled_by IS NOT NULL THEN
    -- Get the kyc_pass status of the enrolling affiliate
    SELECT kyc_pass INTO enrolling_affiliate_kyc_pass
    FROM public.affiliates
    WHERE id = NEW.enrolled_by;
    
    -- If enrolling affiliate hasn't passed KYC, reject the insert/update
    IF enrolling_affiliate_kyc_pass = FALSE OR enrolling_affiliate_kyc_pass IS NULL THEN
      RAISE EXCEPTION 'Cannot enroll customers or affiliates under an affiliate who has not completed KYC verification';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to customers table
DROP TRIGGER IF EXISTS check_customer_enrolling_affiliate_kyc ON public.customers;
CREATE TRIGGER check_customer_enrolling_affiliate_kyc
  BEFORE INSERT OR UPDATE OF enrolled_by
  ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.check_enrolling_affiliate_kyc();

-- Add trigger to affiliates table
DROP TRIGGER IF EXISTS check_affiliate_enrolling_affiliate_kyc ON public.affiliates;
CREATE TRIGGER check_affiliate_enrolling_affiliate_kyc
  BEFORE INSERT OR UPDATE OF enrolled_by
  ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.check_enrolling_affiliate_kyc();

-- Query to check for existing violations (for informational purposes)
-- This will show any customers enrolled by affiliates who haven't passed KYC
SELECT 
  c.customer_id,
  c.first_name,
  c.last_name,
  a.affiliate_id as enrolling_affiliate_id,
  a.kyc_pass as affiliate_kyc_status
FROM public.customers c
JOIN public.affiliates a ON c.enrolled_by = a.id
WHERE a.kyc_pass = FALSE
  AND c.deleted_at IS NULL;