-- Add phone and email fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text;