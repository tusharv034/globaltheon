-- Add subscription column to orders table
ALTER TABLE public.orders
ADD COLUMN subscription boolean NOT NULL DEFAULT false;

-- Add index for better query performance
CREATE INDEX idx_orders_subscription ON public.orders(subscription);