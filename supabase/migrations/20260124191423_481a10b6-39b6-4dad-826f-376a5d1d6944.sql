-- Fix: Restrict profiles table to authenticated users only
-- This prevents public exposure of member personal information (names, emails, phones)

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that requires authentication
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated'::text);