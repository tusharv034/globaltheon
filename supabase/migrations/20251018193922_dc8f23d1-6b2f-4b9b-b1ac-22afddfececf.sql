-- Fix order items: total should be quantity * price
UPDATE public.order_items
SET total = quantity * price;

-- Recalculate order totals based on actual order items
WITH order_totals AS (
  SELECT 
    order_id,
    SUM(total) as items_total
  FROM public.order_items
  GROUP BY order_id
)
UPDATE public.orders o
SET 
  subtotal = COALESCE(ot.items_total, 0),
  shipping_cost = CASE 
    WHEN COALESCE(ot.items_total, 0) > 0 THEN ROUND(COALESCE(ot.items_total, 0) * 0.10, 2)
    ELSE 0
  END,
  tax_amount = CASE 
    WHEN COALESCE(ot.items_total, 0) > 0 THEN ROUND(COALESCE(ot.items_total, 0) * 0.08, 2)
    ELSE 0
  END,
  amount = CASE 
    WHEN COALESCE(ot.items_total, 0) > 0 THEN 
      ROUND(
        COALESCE(ot.items_total, 0) + 
        ROUND(COALESCE(ot.items_total, 0) * 0.10, 2) + 
        ROUND(COALESCE(ot.items_total, 0) * 0.08, 2), 
        2
      )
    ELSE amount
  END,
  amount_paid = CASE 
    WHEN status IN ('Shipped', 'Accepted', 'Printed') AND COALESCE(ot.items_total, 0) > 0 THEN 
      ROUND(
        COALESCE(ot.items_total, 0) + 
        ROUND(COALESCE(ot.items_total, 0) * 0.10, 2) + 
        ROUND(COALESCE(ot.items_total, 0) * 0.08, 2), 
        2
      )
    ELSE 0
  END
FROM order_totals ot
WHERE o.id = ot.order_id;