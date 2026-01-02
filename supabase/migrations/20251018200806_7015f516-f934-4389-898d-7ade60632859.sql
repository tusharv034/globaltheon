-- Create affiliates table
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  address2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  status TEXT NOT NULL DEFAULT 'active',
  rank TEXT DEFAULT 'Affiliate',
  enrolled_by UUID REFERENCES public.affiliates(id),
  total_sales NUMERIC DEFAULT 0,
  total_commissions NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliates
CREATE POLICY "Admins can view all affiliates" 
ON public.affiliates 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert affiliates" 
ON public.affiliates 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update affiliates" 
ON public.affiliates 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete affiliates" 
ON public.affiliates 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_affiliates_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();