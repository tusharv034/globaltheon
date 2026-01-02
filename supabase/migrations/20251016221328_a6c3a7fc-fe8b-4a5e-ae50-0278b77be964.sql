-- Add support_email column to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN support_email text;