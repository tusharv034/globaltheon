-- Add new columns to affiliates table for site name and Teqnavi integration
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS site_name text,
ADD COLUMN IF NOT EXISTS teqnavi_enabled boolean DEFAULT false;