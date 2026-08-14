-- First, enable RLS on storage.objects if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can view their own study documents'
    ) THEN
        -- Create storage policies for study-documents bucket
        CREATE POLICY "Users can view their own study documents" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'study-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own study documents'
    ) THEN
        CREATE POLICY "Users can upload their own study documents" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'study-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own study documents'
    ) THEN
        CREATE POLICY "Users can update their own study documents" 
        ON storage.objects 
        FOR UPDATE 
        USING (bucket_id = 'study-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own study documents'
    ) THEN
        CREATE POLICY "Users can delete their own study documents" 
        ON storage.objects 
        FOR DELETE 
        USING (bucket_id = 'study-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END
$$;