-- Drop existing table to ensure schema update
DROP TABLE IF EXISTS budget_transfers CASCADE;

-- Create budget_transfers table
CREATE TABLE budget_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  from_facility_id UUID NOT NULL REFERENCES facilities(id),
  to_facility_id UUID NOT NULL REFERENCES facilities(id),
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL,
  transfer_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE budget_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Headquarters can see all transfers
CREATE POLICY "Headquarters can see all transfers" ON budget_transfers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM facility_users fu
      JOIN facilities f ON f.id = fu.facility_id
      WHERE fu.user_id = auth.uid()
      AND f.type = 'headquarters'
    )
  );

-- Branches can see transfers where they are the recipient
CREATE POLICY "Branches can see their transfers" ON budget_transfers
  FOR SELECT
  USING (
    to_facility_id IN (
      SELECT facility_id FROM facility_users WHERE user_id = auth.uid()
    )
  );

-- Headquarters can insert transfers
CREATE POLICY "Headquarters can insert transfers" ON budget_transfers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users fu
      JOIN facilities f ON f.id = fu.facility_id
      WHERE fu.user_id = auth.uid()
      AND f.type = 'headquarters'
    )
  );

-- Headquarters can update transfers
CREATE POLICY "Headquarters can update transfers" ON budget_transfers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM facility_users fu
      JOIN facilities f ON f.id = fu.facility_id
      WHERE fu.user_id = auth.uid()
      AND f.type = 'headquarters'
    )
  );
