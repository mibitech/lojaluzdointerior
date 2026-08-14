-- Create table for Copo D'água calendar
CREATE TABLE IF NOT EXISTS public.copo_dagua_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,
  event_date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  session_type TEXT NOT NULL,
  session_degree TEXT,
  study_time TEXT,
  start_time TEXT NOT NULL,
  water_glass_group TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.copo_dagua_calendar ENABLE ROW LEVEL SECURITY;

-- Create policies for copo_dagua_calendar
CREATE POLICY "Authenticated users can view copo dagua calendar"
  ON public.copo_dagua_calendar
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Commission members can manage copo dagua calendar"
  ON public.copo_dagua_calendar
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_commission_member = true
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_copo_dagua_calendar_updated_at
  BEFORE UPDATE ON public.copo_dagua_calendar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();