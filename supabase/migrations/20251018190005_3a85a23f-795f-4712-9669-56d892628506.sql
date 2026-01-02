
-- Drop the old check constraint on orders.status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Update existing orders to have random statuses
UPDATE orders
SET status = CASE 
  WHEN random() < 0.2 THEN 'Accepted'
  WHEN random() < 0.4 THEN 'Printed'
  WHEN random() < 0.6 THEN 'Shipped'
  WHEN random() < 0.8 THEN 'Cancelled'
  ELSE 'Refunded'
END;

-- Add new check constraint with updated status values
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('Accepted', 'Printed', 'Shipped', 'Cancelled', 'Refunded'));

-- Update the default value for new orders
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'Accepted';
