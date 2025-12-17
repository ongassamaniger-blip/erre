-- Create 'documents' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policies
-- We use DO blocks to check existence to avoid errors if they already exist
-- and to avoid DROP POLICY if we don't have permissions to drop system policies

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload documents'
    ) THEN
        CREATE POLICY "Authenticated users can upload documents"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'documents');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can view documents'
    ) THEN
        CREATE POLICY "Authenticated users can view documents"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'documents');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update own documents'
    ) THEN
        CREATE POLICY "Users can update own documents"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'documents' AND owner = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete own documents'
    ) THEN
        CREATE POLICY "Users can delete own documents"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'documents' AND owner = auth.uid());
    END IF;
END $$;
