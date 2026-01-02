-- Create customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  city text,
  state_province text,
  postal_code text,
  country text DEFAULT 'USA',
  customer_type text NOT NULL CHECK (customer_type IN ('retail', 'affiliate')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  enrolled_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  order_date timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Admins can view all customers"
  ON public.customers FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update customers"
  ON public.customers FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete customers"
  ON public.customers FOR DELETE
  USING (is_admin(auth.uid()));

-- RLS Policies for orders
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better query performance
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_customer_type ON public.customers(customer_type);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_enrolled_by ON public.customers(enrolled_by);
CREATE INDEX idx_customers_created_at ON public.customers(created_at);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_order_date ON public.orders(order_date);

-- Insert sample data
INSERT INTO public.customers (customer_id, first_name, last_name, email, phone, address, city, state_province, postal_code, country, customer_type, status, created_at) VALUES
('CUST-001', 'John', 'Smith', 'john.smith@example.com', '555-0101', '123 Main St', 'New York', 'NY', '10001', 'USA', 'retail', 'active', now() - interval '6 months'),
('CUST-002', 'Sarah', 'Johnson', 'sarah.j@example.com', '555-0102', '456 Oak Ave', 'Los Angeles', 'CA', '90001', 'USA', 'affiliate', 'active', now() - interval '5 months'),
('CUST-003', 'Michael', 'Williams', 'mwilliams@example.com', '555-0103', '789 Pine Rd', 'Chicago', 'IL', '60601', 'USA', 'retail', 'active', now() - interval '4 months'),
('CUST-004', 'Emily', 'Brown', 'emily.brown@example.com', '555-0104', '321 Elm St', 'Houston', 'TX', '77001', 'USA', 'retail', 'inactive', now() - interval '8 months'),
('CUST-005', 'David', 'Jones', 'djones@example.com', '555-0105', '654 Maple Dr', 'Phoenix', 'AZ', '85001', 'USA', 'affiliate', 'active', now() - interval '3 months'),
('CUST-006', 'Jessica', 'Davis', 'jessica.d@example.com', '555-0106', '987 Cedar Ln', 'Philadelphia', 'PA', '19019', 'USA', 'retail', 'active', now() - interval '2 months'),
('CUST-007', 'James', 'Miller', 'jmiller@example.com', '555-0107', '147 Birch Ct', 'San Antonio', 'TX', '78201', 'USA', 'retail', 'active', now() - interval '1 month'),
('CUST-008', 'Jennifer', 'Wilson', 'jwilson@example.com', '555-0108', '258 Spruce Way', 'San Diego', 'CA', '92101', 'USA', 'retail', 'active', now() - interval '2 weeks'),
('CUST-009', 'Robert', 'Moore', 'rmoore@example.com', '555-0109', '369 Willow Pl', 'Dallas', 'TX', '75201', 'USA', 'retail', 'suspended', now() - interval '7 months'),
('CUST-010', 'Linda', 'Taylor', 'ltaylor@example.com', '555-0110', '741 Ash Blvd', 'San Jose', 'CA', '95101', 'USA', 'affiliate', 'active', now() - interval '1 week');

-- Insert sample orders
INSERT INTO public.orders (order_number, customer_id, amount, order_date) 
SELECT 
  'ORD-' || LPAD((ROW_NUMBER() OVER())::text, 5, '0'),
  c.id,
  CASE 
    WHEN random() < 0.3 THEN 50 + (random() * 100)::numeric(10,2)
    WHEN random() < 0.6 THEN 150 + (random() * 200)::numeric(10,2)
    ELSE 350 + (random() * 500)::numeric(10,2)
  END,
  c.created_at + (random() * (now() - c.created_at))
FROM public.customers c
CROSS JOIN generate_series(1, 
  CASE 
    WHEN c.status = 'inactive' THEN 0
    WHEN c.customer_type = 'affiliate' THEN 8 + floor(random() * 12)::int
    ELSE 2 + floor(random() * 8)::int
  END
) AS orders;