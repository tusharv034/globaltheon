-- First, set all enrolled_by to NULL temporarily
UPDATE public.customers SET enrolled_by = NULL;

-- Update customers table foreign key to reference affiliates
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_enrolled_by_fkey;
ALTER TABLE public.customers ADD CONSTRAINT customers_enrolled_by_fkey 
  FOREIGN KEY (enrolled_by) REFERENCES public.affiliates(id);

-- Update order_commissions foreign key to reference affiliates  
ALTER TABLE public.order_commissions DROP CONSTRAINT IF EXISTS order_commissions_affiliate_id_fkey;
ALTER TABLE public.order_commissions ADD CONSTRAINT order_commissions_affiliate_id_fkey 
  FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;

-- Delete all existing commission records
DELETE FROM public.order_commissions;

-- Update customers to be enrolled by affiliates (distribute evenly)
DO $$
DECLARE
  customer_rec RECORD;
  affiliate_ids UUID[];
  random_affiliate UUID;
BEGIN
  SELECT ARRAY_AGG(id) INTO affiliate_ids FROM public.affiliates;
  
  FOR customer_rec IN SELECT id FROM public.customers LOOP
    random_affiliate := affiliate_ids[1 + floor(random() * array_length(affiliate_ids, 1))::int];
    
    UPDATE public.customers 
    SET enrolled_by = random_affiliate
    WHERE id = customer_rec.id;
  END LOOP;
END $$;

-- Recalculate commissions for all orders
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
  SELECT * INTO comp_plan FROM public.compensation_plans LIMIT 1;
  
  IF comp_plan IS NULL THEN
    RETURN;
  END IF;

  level_percentages := comp_plan.level_percentages;

  FOR order_rec IN SELECT * FROM public.orders LOOP
    SELECT * INTO customer_rec FROM public.customers WHERE id = order_rec.customer_id;
    
    IF customer_rec.enrolled_by IS NULL THEN
      CONTINUE;
    END IF;

    current_affiliate_id := customer_rec.enrolled_by;
    current_level := 1;

    WHILE current_affiliate_id IS NOT NULL AND current_level <= comp_plan.num_levels LOOP
      SELECT EXISTS(SELECT 1 FROM public.affiliates WHERE id = current_affiliate_id) INTO affiliate_exists;
      
      IF NOT affiliate_exists THEN
        EXIT;
      END IF;

      commission_rate := (level_percentages->>current_level::TEXT)::NUMERIC;
      
      IF commission_rate IS NULL THEN
        EXIT;
      END IF;

      commission_amount := ROUND((order_rec.subtotal * commission_rate / 100), 2);

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

      SELECT enrolled_by INTO next_affiliate_id 
      FROM public.affiliates 
      WHERE id = current_affiliate_id;

      current_affiliate_id := next_affiliate_id;
      current_level := current_level + 1;
    END LOOP;
  END LOOP;
END $$;