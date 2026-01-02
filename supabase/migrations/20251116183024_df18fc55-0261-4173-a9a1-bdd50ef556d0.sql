-- Fix the user_roles UPDATE policy to allow Super Admins to manage all users
-- and regular Admins to manage non-super-admin users
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

CREATE POLICY "Admins can update roles" 
ON user_roles 
FOR UPDATE 
USING (
  CASE
    -- If updating TO or FROM super_admin, user must be super_admin
    WHEN (role = 'super_admin'::app_role) THEN is_super_admin(auth.uid())
    -- For all other roles, admin or super_admin can update
    ELSE is_admin(auth.uid())
  END
);