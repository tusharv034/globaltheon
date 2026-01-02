-- Fix commission period end dates to align to Monday-Sunday (end on Sunday)
UPDATE public.commission_periods
SET end_date = start_date + INTERVAL '6 days'
WHERE end_date IS DISTINCT FROM (start_date + INTERVAL '6 days');