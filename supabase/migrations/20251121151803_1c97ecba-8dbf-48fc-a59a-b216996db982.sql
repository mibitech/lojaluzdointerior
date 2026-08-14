-- Create sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  session_degree TEXT NOT NULL,
  show_description BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  session_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Commission members can manage sessions
CREATE POLICY "Commission members can manage sessions"
ON public.sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_commission_member = true
  )
);

-- Authenticated users can view sessions
CREATE POLICY "Authenticated users can view sessions"
ON public.sessions
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();