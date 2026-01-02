-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Update RLS policy on user_roles to prevent non-super-admins from assigning super_admin role
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  CASE 
    WHEN role = 'super_admin' THEN is_super_admin(auth.uid())
    ELSE is_admin(auth.uid())
  END
);

-- Update RLS policy on user_roles to prevent non-super-admins from updating to super_admin
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  CASE 
    WHEN role = 'super_admin' OR (SELECT role FROM public.user_roles WHERE id = user_roles.id) = 'super_admin'
    THEN is_super_admin(auth.uid())
    ELSE is_admin(auth.uid())
  END
);

-- Update RLS policy on user_roles to prevent non-super-admins from deleting super_admin roles
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  CASE 
    WHEN role = 'super_admin' THEN is_super_admin(auth.uid())
    ELSE is_admin(auth.uid())
  END
);