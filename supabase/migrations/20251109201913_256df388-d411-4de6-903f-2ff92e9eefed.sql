-- Create integrations table to store integration configurations
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for integrations table
CREATE POLICY "Admins can view all integrations"
  ON public.integrations
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert integrations"
  ON public.integrations
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update integrations"
  ON public.integrations
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete integrations"
  ON public.integrations
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default integrations
INSERT INTO public.integrations (integration_name, config) VALUES
  ('sendgrid', '{"from_email": "", "from_name": ""}'::jsonb),
  ('twilio', '{"phone_number": ""}'::jsonb),
  ('resend', '{"from_email": "", "from_name": ""}'::jsonb)
ON CONFLICT (integration_name) DO NOTHING;