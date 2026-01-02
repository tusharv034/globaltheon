-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create social_media_links table
CREATE TABLE public.social_media_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facebook_url TEXT,
  x_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all social media links
CREATE POLICY "Admins can view all social media links"
ON public.social_media_links
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to insert social media links
CREATE POLICY "Admins can insert social media links"
ON public.social_media_links
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to update social media links
CREATE POLICY "Admins can update social media links"
ON public.social_media_links
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Allow admins to delete social media links
CREATE POLICY "Admins can delete social media links"
ON public.social_media_links
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_media_links_updated_at
BEFORE UPDATE ON public.social_media_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();