-- Add approval fields to user_works table
ALTER TABLE public.user_works
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

-- Create index for approved_by
CREATE INDEX IF NOT EXISTS idx_user_works_approved_by ON public.user_works(approved_by);

-- Update RLS policy for commission members to manage user works
DROP POLICY IF EXISTS "Commission members can view all works" ON public.user_works;

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

-- Allow commission members to update user works (for approval)
CREATE POLICY "Commission members can update user works"
ON public.user_works
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true
  )
);