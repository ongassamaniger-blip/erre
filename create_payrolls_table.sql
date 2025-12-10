-- Create payrolls table
CREATE TABLE IF NOT EXISTS payrolls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- YYYY-MM format
    base_salary NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    allowances JSONB DEFAULT '[]'::jsonb,
    deductions JSONB DEFAULT '[]'::jsonb,
    bonuses JSONB DEFAULT '[]'::jsonb,
    gross_salary NUMERIC NOT NULL DEFAULT 0,
    total_deductions NUMERIC NOT NULL DEFAULT 0,
    net_salary NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, approved, paid
    payment_date DATE,
    notes TEXT,
    signed_by_employee BOOLEAN DEFAULT FALSE,
    signed_date TIMESTAMPTZ,
    signed_by TEXT,
    facility_id UUID, -- Assuming facilities table exists, otherwise remove FK or keep as UUID
    iban TEXT,
    bank_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payrolls ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for now, adjust as needed)
CREATE POLICY "Enable read access for authenticated users" ON payrolls
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON payrolls
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON payrolls
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON payrolls
    FOR DELETE
    TO authenticated
    USING (true);
