-- Create calendar_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    all_day BOOLEAN DEFAULT false,
    type TEXT NOT NULL CHECK (type IN ('meeting', 'task', 'reminder', 'deadline', 'holiday', 'project', 'training', 'other')),
    color TEXT,
    location TEXT,
    attendees JSONB DEFAULT '[]'::jsonb,
    reminder JSONB DEFAULT '{"enabled": false, "minutesBefore": []}'::jsonb,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    facility_id UUID REFERENCES facilities(id),
    related_entity_id UUID,
    related_entity_type TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for all users" ON calendar_events;
CREATE POLICY "Enable read access for all users" ON calendar_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON calendar_events;
CREATE POLICY "Enable insert access for authenticated users" ON calendar_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON calendar_events;
CREATE POLICY "Enable update access for authenticated users" ON calendar_events FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON calendar_events;
CREATE POLICY "Enable delete access for authenticated users" ON calendar_events FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_facility_id ON calendar_events(facility_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
