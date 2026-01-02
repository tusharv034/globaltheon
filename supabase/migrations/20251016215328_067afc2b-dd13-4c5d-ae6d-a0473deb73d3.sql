-- Split address field into separate components
ALTER TABLE public.company_settings 
DROP COLUMN address;

ALTER TABLE public.company_settings 
ADD COLUMN address_line1 text,
ADD COLUMN address_line2 text,
ADD COLUMN city text,
ADD COLUMN state_province text,
ADD COLUMN postal_code text;