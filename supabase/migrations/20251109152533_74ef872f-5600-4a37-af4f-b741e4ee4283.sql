-- Allow unauthenticated users to view company settings (needed for login page)
DROP POLICY IF EXISTS "Authenticated users can view company settings" ON company_settings;

CREATE POLICY "Anyone can view company settings"
ON company_settings
FOR SELECT
TO public
USING (true);