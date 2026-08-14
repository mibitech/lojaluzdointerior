-- Create visitors table
CREATE TABLE public.visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  visitor_name text NOT NULL,
  cim text,
  visitor_lodge text,
  city text,
  state text,
  potencia text,
  masonic_degree text,
  email text,
  mobile_phone text,
  landline_phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view visitors"
ON public.visitors
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Commission members can manage visitors"
ON public.visitors
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_commission_member = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_visitors_updated_at
BEFORE UPDATE ON public.visitors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();