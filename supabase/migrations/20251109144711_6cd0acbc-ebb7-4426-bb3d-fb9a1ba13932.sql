-- Add hours_of_operation column to company_settings table
ALTER TABLE public.company_settings
ADD COLUMN hours_of_operation TEXT;