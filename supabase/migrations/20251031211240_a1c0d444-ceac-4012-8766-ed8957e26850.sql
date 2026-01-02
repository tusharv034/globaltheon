-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to automatically calculate commissions when orders are inserted
CREATE OR REPLACE FUNCTION auto_calculate_commissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
  anon_key TEXT;
BEGIN
  -- Get Supabase project details
  function_url := 'https://tglwtxbjwvggikdvahap.supabase.co/functions/v1/calculate-commissions';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbHd0eGJqd3ZnZ2lrZHZhaGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTM3MTIsImV4cCI6MjA3NjE2OTcxMn0.8SimDVcYPOfBsJ4JEshWJ3_ivNFUadGFY15M4oNstm0';
  
  -- Call the calculate-commissions edge function asynchronously
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'orderId', NEW.id::text
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_auto_calculate_commissions ON orders;
CREATE TRIGGER trigger_auto_calculate_commissions
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_commissions();

-- Add comment
COMMENT ON FUNCTION auto_calculate_commissions() IS 'Automatically triggers commission calculation when a new order is inserted';