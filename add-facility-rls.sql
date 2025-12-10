-- Add RLS policies for facilities table to allow Super Admins to manage them

-- Allow Super Admins to insert new facilities
CREATE POLICY "Super Admins can create facilities" ON public.facilities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

-- Allow Super Admins to update facilities
CREATE POLICY "Super Admins can update facilities" ON public.facilities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

-- Allow Super Admins to delete facilities
CREATE POLICY "Super Admins can delete facilities" ON public.facilities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

-- Also allow Super Admins to view ALL facilities (override the existing select policy if needed, or add as a new one)
-- The existing policy only allows viewing facilities the user is assigned to.
-- Super Admins should see everything.
CREATE POLICY "Super Admins can view all facilities" ON public.facilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );
