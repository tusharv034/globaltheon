-- Insert Tipalti integration if it doesn't exist
INSERT INTO public.integrations (integration_name, is_enabled, config)
VALUES ('tipalti', false, '{"payer_name": "", "iframe_url": ""}'::jsonb)
ON CONFLICT (integration_name) DO NOTHING;