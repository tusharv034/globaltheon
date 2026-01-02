-- Clean up fake affiliates and their associated data created by mistake

-- Delete order commissions for orders from the fake level 2 customers
DELETE FROM order_commissions 
WHERE order_id IN (
  SELECT id FROM orders 
  WHERE customer_id IN (
    SELECT id FROM customers 
    WHERE enrolled_by IN (
      SELECT id FROM affiliates WHERE affiliate_id LIKE 'AFF-LAIRE-%'
    )
  )
);

-- Delete order items for orders from the fake level 2 customers
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders 
  WHERE customer_id IN (
    SELECT id FROM customers 
    WHERE enrolled_by IN (
      SELECT id FROM affiliates WHERE affiliate_id LIKE 'AFF-LAIRE-%'
    )
  )
);

-- Delete orders from the fake level 2 customers
DELETE FROM orders 
WHERE customer_id IN (
  SELECT id FROM customers 
  WHERE enrolled_by IN (
    SELECT id FROM affiliates WHERE affiliate_id LIKE 'AFF-LAIRE-%'
  )
);

-- Delete the fake level 2 customers
DELETE FROM customers 
WHERE enrolled_by IN (
  SELECT id FROM affiliates WHERE affiliate_id LIKE 'AFF-LAIRE-%'
);

-- Delete the fake affiliates
DELETE FROM affiliates WHERE affiliate_id LIKE 'AFF-LAIRE-%';