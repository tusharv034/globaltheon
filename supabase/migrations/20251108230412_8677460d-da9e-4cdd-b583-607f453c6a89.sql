-- Create deletion_logs table to track permanent deletions
CREATE TABLE public.deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('customer', 'affiliate', 'order')),
  entity_id UUID NOT NULL,
  entity_identifier TEXT NOT NULL,
  entity_name TEXT,
  deleted_by UUID NOT NULL REFERENCES auth.users(id),
  deletion_type TEXT NOT NULL CHECK (deletion_type IN ('single', 'bulk_empty_folder')),
  deletion_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  additional_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all deletion logs
CREATE POLICY "Admins can view all deletion logs"
ON public.deletion_logs
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Create policy for admins to insert deletion logs
CREATE POLICY "Admins can insert deletion logs"
ON public.deletion_logs
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Create index for efficient querying
CREATE INDEX idx_deletion_logs_entity_type ON public.deletion_logs(entity_type);
CREATE INDEX idx_deletion_logs_deleted_by ON public.deletion_logs(deleted_by);
CREATE INDEX idx_deletion_logs_deletion_date ON public.deletion_logs(deletion_date DESC);