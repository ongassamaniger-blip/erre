-- Add search indexes for global search functionality
-- These indexes improve search performance using ILIKE queries

-- Transactions search index
CREATE INDEX IF NOT EXISTS idx_transactions_search 
ON public.transactions USING gin(
  to_tsvector('turkish', 
    COALESCE(transaction_number, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(notes, '')
  )
);

-- Also add regular index for ILIKE searches
CREATE INDEX IF NOT EXISTS idx_transactions_description 
ON public.transactions(description text_pattern_ops);

-- Employees search index
CREATE INDEX IF NOT EXISTS idx_employees_search 
ON public.employees USING gin(
  to_tsvector('turkish',
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(position, '') || ' ' ||
    COALESCE(department, '')
  )
);

-- Projects search index
CREATE INDEX IF NOT EXISTS idx_projects_search 
ON public.projects USING gin(
  to_tsvector('turkish',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(code, '')
  )
);

-- Qurban campaigns search index
CREATE INDEX IF NOT EXISTS idx_qurban_campaigns_search 
ON public.qurban_campaigns USING gin(
  to_tsvector('turkish',
    COALESCE(name, '') || ' ' ||
    COALESCE(description, '')
  )
);

-- Qurban donations search index (donor name)
CREATE INDEX IF NOT EXISTS idx_qurban_donations_search 
ON public.qurban_donations USING gin(
  to_tsvector('turkish',
    COALESCE(donor_name, '') || ' ' ||
    COALESCE(donor_phone, '')
  )
);

-- Leave requests search index
CREATE INDEX IF NOT EXISTS idx_leave_requests_search 
ON public.leave_requests USING gin(
  to_tsvector('turkish',
    COALESCE(reason, '') || ' ' ||
    COALESCE(leave_type, '')
  )
);

-- Approval requests search index
CREATE INDEX IF NOT EXISTS idx_approval_requests_search 
ON public.approval_requests USING gin(
  to_tsvector('turkish',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '')
  )
);

