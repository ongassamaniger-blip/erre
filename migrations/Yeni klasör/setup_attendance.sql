-- Create attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    working_hours NUMERIC,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half-day', 'leave')),
    late_minutes INTEGER,
    notes TEXT,
    facility_id UUID REFERENCES facilities(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for all users" ON attendance;
CREATE POLICY "Enable read access for all users" ON attendance FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON attendance;
CREATE POLICY "Enable insert access for authenticated users" ON attendance FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON attendance;
CREATE POLICY "Enable update access for authenticated users" ON attendance FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON attendance;
CREATE POLICY "Enable delete access for authenticated users" ON attendance FOR DELETE USING (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_facility_id ON attendance(facility_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
