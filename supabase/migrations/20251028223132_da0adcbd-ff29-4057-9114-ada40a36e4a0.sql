
-- Fix all commission rates and recalculate all commission amounts
-- Step 1: Fix commission rates that are stored as percentages instead of decimals
UPDATE order_commissions
SET commission_rate = CASE 
  WHEN level = 1 AND commission_rate > 1 THEN 0.25
  WHEN level = 2 AND commission_rate > 1 THEN 0.12
  ELSE commission_rate
END
WHERE commission_rate > 1;

-- Step 2: Recalculate ALL commission amounts based on order subtotals
UPDATE order_commissions oc
SET commission_amount = ROUND(o.subtotal * oc.commission_rate, 2)
FROM orders o
WHERE oc.order_id = o.id;
