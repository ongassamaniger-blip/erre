-- Drop table if exists to ensure schema update
DROP TABLE IF EXISTS public.project_documents CASCADE;

-- Create project_documents table
CREATE TABLE public.project_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view documents of projects they have access to" ON public.project_documents;
DROP POLICY IF EXISTS "Users can upload documents to projects" ON public.project_documents;
DROP POLICY IF EXISTS "Users can delete their own documents or project managers" ON public.project_documents;

-- Policies for project_documents
CREATE POLICY "Users can view documents of projects they have access to"
    ON public.project_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = project_documents.project_id
        )
    );

CREATE POLICY "Users can upload documents to projects"
    ON public.project_documents FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own documents or project managers"
    ON public.project_documents FOR DELETE
    USING (
        auth.uid() = uploaded_by OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = project_documents.project_id AND manager_id = auth.uid()
        )
    );

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Force update to public just in case it was created as private
UPDATE storage.buckets
SET public = true
WHERE id = 'project-documents';

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users can upload project documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload project documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-documents');

CREATE POLICY "Anyone can view project documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-documents');

CREATE POLICY "Users can delete their own project documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-documents' AND owner = auth.uid());
