-- Add new columns to orders table for comprehensive order information
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS sales_tax_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refunded_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;

-- Create order_items table for line items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order_items
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert order items"
ON public.order_items
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update order items"
ON public.order_items
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete order items"
ON public.order_items
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for order_items updated_at
CREATE TRIGGER update_order_items_updated_at
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample data to existing orders
UPDATE public.orders
SET 
  shipping_method = CASE 
    WHEN random() < 0.5 THEN 'Standard Shipping'
    ELSE 'Express Shipping'
  END,
  payment_method = CASE 
    WHEN random() < 0.33 THEN 'Credit Card'
    WHEN random() < 0.66 THEN 'PayPal'
    ELSE 'Debit Card'
  END,
  payment_date = order_date + INTERVAL '1 hour',
  subtotal = amount * 0.85,
  shipping_cost = amount * 0.10,
  tax_amount = amount * 0.05,
  amount_paid = CASE 
    WHEN status IN ('Shipped', 'Accepted', 'Printed') THEN amount
    ELSE 0
  END,
  cancelled_date = CASE 
    WHEN status = 'Cancelled' THEN updated_at
    ELSE NULL
  END,
  refunded_date = CASE 
    WHEN status = 'Refunded' THEN updated_at
    ELSE NULL
  END
WHERE shipping_method IS NULL;

-- Insert sample order items for existing orders
INSERT INTO public.order_items (order_id, item_id, description, quantity, price, total)
SELECT 
  id,
  'ITEM-' || LPAD((ROW_NUMBER() OVER (PARTITION BY id))::TEXT, 4, '0'),
  CASE (ROW_NUMBER() OVER (PARTITION BY id))
    WHEN 1 THEN 'Premium Product Package'
    WHEN 2 THEN 'Starter Kit Bundle'
    WHEN 3 THEN 'Advanced Training Course'
    ELSE 'Additional Product'
  END,
  (1 + floor(random() * 5))::INTEGER,
  (10 + random() * 90)::NUMERIC(10,2),
  ((1 + floor(random() * 5)) * (10 + random() * 90))::NUMERIC(10,2)
FROM public.orders
CROSS JOIN generate_series(1, (1 + floor(random() * 3))::INTEGER) AS item_num
ON CONFLICT DO NOTHING;