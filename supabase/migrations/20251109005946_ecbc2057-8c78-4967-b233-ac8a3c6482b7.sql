-- Add columns to track status changes and who made them
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS status_changed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status_change_reason text,
ADD COLUMN IF NOT EXISTS status_changed_at timestamp with time zone;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_affiliates_status_changed_by ON public.affiliates(status_changed_by);
CREATE INDEX IF NOT EXISTS idx_affiliates_status_changed_at ON public.affiliates(status_changed_at);