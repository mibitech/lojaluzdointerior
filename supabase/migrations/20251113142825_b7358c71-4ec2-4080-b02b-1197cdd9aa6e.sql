-- Allow commission members to update any profile
CREATE POLICY "Commission members can update profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_commission_member = true
  )
);