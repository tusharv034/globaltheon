-- Add shopify_order_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shopify_order_number text;

-- Populate existing orders with sequential Shopify order numbers starting from 40000
WITH numbered_orders AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) + 39999 AS shopify_num
  FROM orders
  WHERE shopify_order_number IS NULL
)
UPDATE orders
SET shopify_order_number = numbered_orders.shopify_num::text
FROM numbered_orders
WHERE orders.id = numbered_orders.id;