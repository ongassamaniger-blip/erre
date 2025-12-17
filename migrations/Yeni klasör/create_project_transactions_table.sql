-- Create project_transactions table
CREATE TABLE IF NOT EXISTS public.project_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL, -- Link to main finance transaction
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    category TEXT,
    description TEXT,
    vendor_customer_name TEXT,
    vendor_customer_id UUID REFERENCES public.vendors_customers(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.project_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Facility users can view project transactions" ON public.project_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_transactions.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

CREATE POLICY "Facility users can insert project transactions" ON public.project_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_transactions.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

CREATE POLICY "Facility users can update project transactions" ON public.project_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_transactions.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );

CREATE POLICY "Facility users can delete project transactions" ON public.project_transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.facility_users fu ON p.facility_id = fu.facility_id
            WHERE p.id = project_transactions.project_id
            AND fu.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Super Admin'
        )
    );
