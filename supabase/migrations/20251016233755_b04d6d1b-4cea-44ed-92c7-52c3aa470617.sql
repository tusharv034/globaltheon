-- Drop the existing admin-only view policy
DROP POLICY IF EXISTS "Admins can view all social media links" ON public.social_media_links;

-- Create a new policy that allows all authenticated users to view social media links
CREATE POLICY "Authenticated users can view social media links"
ON public.social_media_links
FOR SELECT
USING (true);