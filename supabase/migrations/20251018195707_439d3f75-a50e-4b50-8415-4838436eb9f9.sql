-- Create commissions table to store commission records
CREATE TABLE public.order_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  commission_rate NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_commissions ENABLE ROW LEVEL SECURITY;

-- Create policies for order_commissions
CREATE POLICY "Admins can view all order commissions" 
ON public.order_commissions 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert order commissions" 
ON public.order_commissions 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update order commissions" 
ON public.order_commissions 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete order commissions" 
ON public.order_commissions 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_order_commissions_updated_at
BEFORE UPDATE ON public.order_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Populate commission records for all existing orders
DO $$
DECLARE
  order_rec RECORD;
  customer_rec RECORD;
  comp_plan RECORD;
  current_affiliate_id UUID;
  next_affiliate_id UUID;
  current_level INTEGER;
  commission_rate NUMERIC;
  commission_amount NUMERIC;
  level_percentages JSONB;
  affiliate_exists BOOLEAN;
BEGIN
  -- Get the compensation plan
  SELECT * INTO comp_plan FROM public.compensation_plans LIMIT 1;
  
  IF comp_plan IS NULL THEN
    RAISE NOTICE 'No compensation plan found';
    RETURN;
  END IF;

  level_percentages := comp_plan.level_percentages;

  -- Loop through all orders
  FOR order_rec IN SELECT * FROM public.orders LOOP
    -- Get the customer for this order
    SELECT * INTO customer_rec FROM public.customers WHERE id = order_rec.customer_id;
    
    IF customer_rec.enrolled_by IS NULL THEN
      CONTINUE;
    END IF;

    -- Start with the direct enrolling affiliate
    current_affiliate_id := customer_rec.enrolled_by;
    current_level := 1;

    -- Loop through upline levels
    WHILE current_affiliate_id IS NOT NULL AND current_level <= comp_plan.num_levels LOOP
      -- Check if the affiliate exists in the customers table
      SELECT EXISTS(SELECT 1 FROM public.customers WHERE id = current_affiliate_id) INTO affiliate_exists;
      
      IF NOT affiliate_exists THEN
        RAISE NOTICE 'Affiliate % does not exist, skipping', current_affiliate_id;
        EXIT;
      END IF;

      -- Get the commission rate for this level
      commission_rate := (level_percentages->>current_level::TEXT)::NUMERIC;
      
      IF commission_rate IS NULL THEN
        EXIT;
      END IF;

      -- Calculate commission amount based on order subtotal
      commission_amount := ROUND((order_rec.subtotal * commission_rate / 100), 2);

      -- Insert commission record
      INSERT INTO public.order_commissions (
        order_id,
        affiliate_id,
        level,
        commission_rate,
        commission_amount
      ) VALUES (
        order_rec.id,
        current_affiliate_id,
        current_level,
        commission_rate,
        commission_amount
      );

      -- Get the next level affiliate
      SELECT enrolled_by INTO next_affiliate_id 
      FROM public.customers 
      WHERE id = current_affiliate_id;

      current_affiliate_id := next_affiliate_id;
      current_level := current_level + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Commission records created successfully';
END $$;