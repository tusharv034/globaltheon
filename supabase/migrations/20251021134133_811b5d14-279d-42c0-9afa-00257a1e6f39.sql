-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'general',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  show_once BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create user_announcements table to track which announcements users have seen/completed
CREATE TABLE public.user_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_announcements ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "Admins can view all announcements"
  ON public.announcements FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active announcements"
  ON public.announcements FOR SELECT
  USING (is_active = true AND (
    start_date IS NULL OR start_date <= now()
  ) AND (
    end_date IS NULL OR end_date >= now()
  ));

-- User announcements policies
CREATE POLICY "Users can view their own announcement interactions"
  ON public.user_announcements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own announcement interactions"
  ON public.user_announcements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own announcement interactions"
  ON public.user_announcements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user announcement interactions"
  ON public.user_announcements FOR SELECT
  USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();