-- Add requires_completion column to announcements table
ALTER TABLE public.announcements
ADD COLUMN requires_completion boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.announcements.requires_completion IS 'If true, users must check the completed box to dismiss the announcement';