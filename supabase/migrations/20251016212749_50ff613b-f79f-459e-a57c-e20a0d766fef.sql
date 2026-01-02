-- Add avatar customization columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN avatar_color TEXT DEFAULT '#3b82f6',
ADD COLUMN avatar_initials TEXT;

-- Add constraint to limit initials to 4 characters
ALTER TABLE public.profiles 
ADD CONSTRAINT avatar_initials_length CHECK (avatar_initials IS NULL OR char_length(avatar_initials) <= 4);