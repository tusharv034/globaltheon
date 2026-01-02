-- Add template_id column to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN template_id TEXT UNIQUE;

-- Add a comment to explain the column
COMMENT ON COLUMN public.email_templates.template_id IS 'Unique identifier code for programmatic reference to this template';