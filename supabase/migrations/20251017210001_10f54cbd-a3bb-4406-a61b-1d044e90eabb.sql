-- Create master email template table for header/footer configuration
CREATE TABLE IF NOT EXISTS public.email_master_template (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  header_html text DEFAULT '',
  footer_html text DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_master_template ENABLE ROW LEVEL SECURITY;

-- Admins can view master template
CREATE POLICY "Admins can view email master template"
ON public.email_master_template
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert master template
CREATE POLICY "Admins can insert email master template"
ON public.email_master_template
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Admins can update master template
CREATE POLICY "Admins can update email master template"
ON public.email_master_template
FOR UPDATE
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_email_master_template_updated_at
BEFORE UPDATE ON public.email_master_template
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add column to email_templates to track if they use the master template
ALTER TABLE public.email_templates
ADD COLUMN IF NOT EXISTS use_master_template boolean NOT NULL DEFAULT false;

-- Insert default master template row (singleton pattern)
INSERT INTO public.email_master_template (header_html, footer_html, is_enabled)
VALUES ('', '', false)
ON CONFLICT DO NOTHING;