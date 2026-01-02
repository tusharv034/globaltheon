-- Add KYC fields to affiliates table
ALTER TABLE public.affiliates
ADD COLUMN kyc_pass boolean NOT NULL DEFAULT true,
ADD COLUMN kyc_submitted_at timestamp with time zone,
ADD COLUMN kyc_approved_at timestamp with time zone,
ADD COLUMN kyc_data jsonb,
ADD COLUMN kyc_rejection_reason text;

-- Add comment for clarity
COMMENT ON COLUMN public.affiliates.kyc_pass IS 'Whether affiliate has passed KYC compliance check';
COMMENT ON COLUMN public.affiliates.kyc_data IS 'Stores KYC form responses in JSON format';
COMMENT ON COLUMN public.affiliates.kyc_rejection_reason IS 'Admin notes when KYC is rejected';