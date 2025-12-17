ALTER TABLE public.project_transactions 
ADD COLUMN IF NOT EXISTS vendor_customer_id UUID REFERENCES public.vendors_customers(id);
