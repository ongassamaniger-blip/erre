-- Create the storage bucket 'qurban-photos' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('qurban-photos', 'qurban-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket (standard practice)
-- Note: We don't need to explicitly enable RLS on storage.objects as it's usually enabled by default,
-- but we do need policies.

-- 1. Allow public read access to all files in the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'qurban-photos' );

-- 2. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'qurban-photos' );

-- 3. Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'qurban-photos' AND auth.uid() = owner );

-- 4. Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'qurban-photos' AND auth.uid() = owner );
