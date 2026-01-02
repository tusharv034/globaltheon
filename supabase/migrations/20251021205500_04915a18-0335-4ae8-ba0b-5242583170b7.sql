-- Create affiliate_notes table
CREATE TABLE public.affiliate_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'note',
  metadata JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.affiliate_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all affiliate notes" 
ON public.affiliate_notes 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert affiliate notes" 
ON public.affiliate_notes 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update affiliate notes" 
ON public.affiliate_notes 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete affiliate notes" 
ON public.affiliate_notes 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_affiliate_notes_updated_at
BEFORE UPDATE ON public.affiliate_notes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();