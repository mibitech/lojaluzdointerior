-- Create user_works table
CREATE TABLE public.user_works (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_title text NOT NULL,
  file_path text,
  description text,
  category text NOT NULL DEFAULT 'geral',
  masonic_degree integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_works ENABLE ROW LEVEL SECURITY;

-- Users can view their own works
CREATE POLICY "Users can view their own works"
ON public.user_works
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own works
CREATE POLICY "Users can insert their own works"
ON public.user_works
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own works
CREATE POLICY "Users can update their own works"
ON public.user_works
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own works
CREATE POLICY "Users can delete their own works"
ON public.user_works
FOR DELETE
USING (auth.uid() = user_id);

-- Commission members can view all works
CREATE POLICY "Commission members can view all works"
ON public.user_works
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_user_works_updated_at
BEFORE UPDATE ON public.user_works
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user-works storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-works', 'user-works', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own works
CREATE POLICY "Users can upload their own works"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-works' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own works
CREATE POLICY "Users can update their own works files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-works' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own works
CREATE POLICY "Users can delete their own works files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-works' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own works
CREATE POLICY "Users can view their own works files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-works' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow commission members to view all works files
CREATE POLICY "Commission members can view all works files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-works' 
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true
  )
);