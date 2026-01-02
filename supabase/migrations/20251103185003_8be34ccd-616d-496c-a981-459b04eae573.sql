-- Add target_role column to announcements table
ALTER TABLE public.announcements 
ADD COLUMN target_role text NOT NULL DEFAULT 'all';

-- Add comment to explain the column
COMMENT ON COLUMN public.announcements.target_role IS 'Target audience: all, admin, or affiliate';