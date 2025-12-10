-- Add DELETE policy for qurban_campaigns
-- This fixes the "Kampanya silinemedi" error
CREATE POLICY "Users can delete campaigns" ON public.qurban_campaigns
  FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Add policies for qurban_donations (Missing from schema)
CREATE POLICY "Users can view own facility donations" ON public.qurban_donations
  FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));

CREATE POLICY "Users can create donations" ON public.qurban_donations
  FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));

CREATE POLICY "Users can update donations" ON public.qurban_donations
  FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));

CREATE POLICY "Users can delete donations" ON public.qurban_donations
  FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Add policies for qurban_schedules (Missing from schema)
CREATE POLICY "Users can view own facility schedules" ON public.qurban_schedules
  FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));

CREATE POLICY "Users can create schedules" ON public.qurban_schedules
  FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));

CREATE POLICY "Users can update schedules" ON public.qurban_schedules
  FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));

CREATE POLICY "Users can delete schedules" ON public.qurban_schedules
  FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));

-- Add policies for distribution_records (Missing from schema)
CREATE POLICY "Users can view own facility distributions" ON public.distribution_records
  FOR SELECT USING (facility_id IS NULL OR has_facility_access(facility_id));

CREATE POLICY "Users can create distributions" ON public.distribution_records
  FOR INSERT WITH CHECK (facility_id IS NULL OR has_facility_access(facility_id));

CREATE POLICY "Users can update distributions" ON public.distribution_records
  FOR UPDATE USING (facility_id IS NULL OR has_facility_access(facility_id));

CREATE POLICY "Users can delete distributions" ON public.distribution_records
  FOR DELETE USING (facility_id IS NULL OR has_facility_access(facility_id));
