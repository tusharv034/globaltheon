-- Create enum for note types
CREATE TYPE public.note_type AS ENUM ('note', 'merge');

-- Create customer_notes table
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  note_type note_type NOT NULL DEFAULT 'note',
  metadata JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_notes table
CREATE TABLE IF NOT EXISTS public.order_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_notes
CREATE POLICY "Admins can view all customer notes"
ON public.customer_notes
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert customer notes"
ON public.customer_notes
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update customer notes"
ON public.customer_notes
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete customer notes"
ON public.customer_notes
FOR DELETE
USING (is_admin(auth.uid()));

-- Create RLS policies for order_notes
CREATE POLICY "Admins can view all order notes"
ON public.order_notes
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert order notes"
ON public.order_notes
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update order notes"
ON public.order_notes
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete order notes"
ON public.order_notes
FOR DELETE
USING (is_admin(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_customer_notes_updated_at
BEFORE UPDATE ON public.customer_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_notes_updated_at
BEFORE UPDATE ON public.order_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_customer_notes_customer_id ON public.customer_notes(customer_id);
CREATE INDEX idx_customer_notes_created_at ON public.customer_notes(created_at DESC);
CREATE INDEX idx_order_notes_order_id ON public.order_notes(order_id);
CREATE INDEX idx_order_notes_created_at ON public.order_notes(created_at DESC);