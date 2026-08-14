-- Create profiles bucket for profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own profile photo
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own profile photo
CREATE POLICY "Users can update their own profile photo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own profile photo
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow everyone to view profile photos (public bucket)
CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profiles');