-- Create commission_periods table
CREATE TABLE public.commission_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_number integer NOT NULL UNIQUE,
  display_in_backoffice boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid', 'not_funded')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_affiliate_commissions numeric NOT NULL DEFAULT 0,
  total_adjustments numeric NOT NULL DEFAULT 0,
  total_commissions numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create commission_period_adjustments table for tracking adjustments
CREATE TABLE public.commission_period_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id uuid NOT NULL REFERENCES public.commission_periods(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  adjustment_amount numeric NOT NULL,
  reason text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_period_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commission_periods
CREATE POLICY "Admins can view all commission periods"
  ON public.commission_periods FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert commission periods"
  ON public.commission_periods FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update commission periods"
  ON public.commission_periods FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete commission periods"
  ON public.commission_periods FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for commission_period_adjustments
CREATE POLICY "Admins can view all adjustments"
  ON public.commission_period_adjustments FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert adjustments"
  ON public.commission_period_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update adjustments"
  ON public.commission_period_adjustments FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete adjustments"
  ON public.commission_period_adjustments FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_commission_periods_updated_at
  BEFORE UPDATE ON public.commission_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_commission_period_adjustments_updated_at
  BEFORE UPDATE ON public.commission_period_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();