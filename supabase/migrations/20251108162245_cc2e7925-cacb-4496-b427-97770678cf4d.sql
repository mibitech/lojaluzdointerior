-- Create storage buckets for profiles and masters photos
insert into storage.buckets (id, name, public)
values 
  ('profiles', 'profiles', true),
  ('masters', 'masters', true)
on conflict (id) do nothing;

-- Create RLS policies for profiles bucket
CREATE POLICY "Profiles photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Commission members can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_commission_member = true
  )
);

CREATE POLICY "Commission members can update profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_commission_member = true
  )
);

CREATE POLICY "Commission members can delete profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_commission_member = true
  )
);

-- Create RLS policies for masters bucket
CREATE POLICY "Masters photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'masters');

CREATE POLICY "Commission members can upload master photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'masters' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_commission_member = true
  )
);

CREATE POLICY "Commission members can update master photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'masters' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_commission_member = true
  )
);

CREATE POLICY "Commission members can delete master photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'masters' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_commission_member = true
  )
);