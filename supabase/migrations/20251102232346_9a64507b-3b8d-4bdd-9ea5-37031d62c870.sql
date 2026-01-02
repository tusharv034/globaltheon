-- Ensure FK so nested select to profiles works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'commission_period_adjustments'
      AND constraint_name = 'commission_period_adjustments_created_by_fkey'
  ) THEN
    ALTER TABLE public.commission_period_adjustments
    ADD CONSTRAINT commission_period_adjustments_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT;
  END IF;
END $$;