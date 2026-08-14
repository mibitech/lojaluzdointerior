-- Create session_attendances table
CREATE TABLE public.session_attendances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_present BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.session_attendances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view attendances"
ON public.session_attendances
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Commission members can manage attendances"
ON public.session_attendances
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_commission_member = true
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_session_attendances_updated_at
BEFORE UPDATE ON public.session_attendances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();