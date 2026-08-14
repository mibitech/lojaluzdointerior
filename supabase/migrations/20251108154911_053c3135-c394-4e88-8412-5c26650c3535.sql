-- Add commemorative date fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS initiation_date date,
ADD COLUMN IF NOT EXISTS spouse_name text,
ADD COLUMN IF NOT EXISTS spouse_birth_date date;

-- Create table for additional commemorative dates (children, etc)
CREATE TABLE IF NOT EXISTS public.commemorative_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_type text NOT NULL, -- 'child', 'other'
  description text NOT NULL, -- e.g., "Filho João", "Aniversário de casamento"
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commemorative_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commemorative_dates
CREATE POLICY "Commemorative dates are viewable by authenticated users"
  ON public.commemorative_dates
  FOR SELECT
  USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Commission members can manage commemorative dates"
  ON public.commemorative_dates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_commission_member = true
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_commemorative_dates_updated_at
  BEFORE UPDATE ON public.commemorative_dates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_commemorative_dates_profile_id 
  ON public.commemorative_dates(profile_id);