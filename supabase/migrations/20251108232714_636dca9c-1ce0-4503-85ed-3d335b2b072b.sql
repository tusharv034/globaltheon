-- Add allow_automatic_chargebacks flag to affiliates table
ALTER TABLE public.affiliates
ADD COLUMN allow_automatic_chargebacks boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.affiliates.allow_automatic_chargebacks IS 'When false, prevents automatic commission clawbacks for orders in closed/paid periods. Requires manual adjustment instead.';