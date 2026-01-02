
-- Delete all existing order items (generic/incorrect data)
DELETE FROM order_items;

-- Insert realistic order items for all orders using actual Shopify products
-- Products: AETHER Daily Essential Superfood ($69.95), Alpha Bios ($79.99), AE17 (v2) ($52.95), AETHER Bundle Set ($139.90), Anointed Bundle ($389.99)

INSERT INTO order_items (order_id, item_id, description, quantity, price, total)
SELECT 
  o.id as order_id,
  CASE 
    -- For orders with subtotal close to single products
    WHEN o.subtotal BETWEEN 360 AND 410 THEN 'PROD-005'
    WHEN o.subtotal BETWEEN 130 AND 150 THEN 'PROD-004'
    WHEN o.subtotal BETWEEN 75 AND 85 THEN 'PROD-002'
    WHEN o.subtotal BETWEEN 65 AND 75 THEN 'PROD-001'
    WHEN o.subtotal BETWEEN 50 AND 60 THEN 'PROD-003'
    -- For multi-item orders, use the primary product
    ELSE 'PROD-001'
  END as item_id,
  CASE 
    WHEN o.subtotal BETWEEN 360 AND 410 THEN 'Anointed Bundle'
    WHEN o.subtotal BETWEEN 130 AND 150 THEN 'AETHER Bundle Set'
    WHEN o.subtotal BETWEEN 75 AND 85 THEN 'Alpha Bios'
    WHEN o.subtotal BETWEEN 65 AND 75 THEN 'AETHER Daily Essential Superfood'
    WHEN o.subtotal BETWEEN 50 AND 60 THEN 'AE17 (v2)'
    ELSE 'AETHER Daily Essential Superfood'
  END as description,
  CASE 
    -- Calculate quantity based on subtotal
    WHEN o.subtotal BETWEEN 360 AND 410 THEN 1
    WHEN o.subtotal BETWEEN 130 AND 150 THEN 1
    WHEN o.subtotal BETWEEN 75 AND 85 THEN 1
    WHEN o.subtotal BETWEEN 65 AND 75 THEN 1
    WHEN o.subtotal BETWEEN 50 AND 60 THEN 1
    WHEN o.subtotal > 400 THEN LEAST(GREATEST(ROUND(o.subtotal / 79.99), 1), 10)
    WHEN o.subtotal > 200 THEN LEAST(GREATEST(ROUND(o.subtotal / 69.95), 1), 6)
    ELSE LEAST(GREATEST(ROUND(o.subtotal / 52.95), 1), 4)
  END as quantity,
  CASE 
    WHEN o.subtotal BETWEEN 360 AND 410 THEN 389.99
    WHEN o.subtotal BETWEEN 130 AND 150 THEN 139.90
    WHEN o.subtotal BETWEEN 75 AND 85 THEN 79.99
    WHEN o.subtotal BETWEEN 65 AND 75 THEN 69.95
    WHEN o.subtotal BETWEEN 50 AND 60 THEN 52.95
    WHEN o.subtotal > 400 THEN 79.99
    WHEN o.subtotal > 200 THEN 69.95
    ELSE 52.95
  END as price,
  o.subtotal as total
FROM orders o;

-- Add second item for orders with larger subtotals to make combinations more realistic
INSERT INTO order_items (order_id, item_id, description, quantity, price, total)
SELECT 
  o.id as order_id,
  'PROD-003' as item_id,
  'AE17 (v2)' as description,
  1 as quantity,
  52.95 as price,
  52.95 as total
FROM orders o
WHERE o.subtotal > 150 
  AND o.subtotal < 350
  AND MOD(CAST(SUBSTRING(o.order_number FROM '[0-9]+$') AS INTEGER), 3) = 0;

-- Add Alpha Bios as second item for some larger orders
INSERT INTO order_items (order_id, item_id, description, quantity, price, total)
SELECT 
  o.id as order_id,
  'PROD-002' as item_id,
  'Alpha Bios' as description,
  1 as quantity,
  79.99 as price,
  79.99 as total
FROM orders o
WHERE o.subtotal > 200 
  AND o.subtotal < 500
  AND MOD(CAST(SUBSTRING(o.order_number FROM '[0-9]+$') AS INTEGER), 3) = 1;
