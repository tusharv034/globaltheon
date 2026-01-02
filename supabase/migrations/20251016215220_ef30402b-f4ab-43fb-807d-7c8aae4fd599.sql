-- Add jsonb column for dynamic level percentages
ALTER TABLE public.compensation_plans 
ADD COLUMN level_percentages jsonb DEFAULT '{"1": 10.0, "2": 5.0}'::jsonb;

-- Migrate existing data to the new structure
UPDATE public.compensation_plans
SET level_percentages = jsonb_build_object(
  '1', level_1_percentage,
  '2', level_2_percentage
);

-- Drop old columns
ALTER TABLE public.compensation_plans 
DROP COLUMN level_1_percentage,
DROP COLUMN level_2_percentage;