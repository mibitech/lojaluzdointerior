-- Create meeting_minutes table for storing meeting minutes
CREATE TABLE public.meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  masonic_degree INTEGER NOT NULL CHECK (masonic_degree BETWEEN 1 AND 3),
  meeting_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create meeting_minutes_files table for storing multiple files per minute
CREATE TABLE public.meeting_minutes_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minute_id UUID REFERENCES public.meeting_minutes(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on meeting_minutes
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on meeting_minutes_files
ALTER TABLE public.meeting_minutes_files ENABLE ROW LEVEL SECURITY;

-- Policy: Commission members can manage meeting minutes
CREATE POLICY "Commission members can manage meeting minutes"
ON public.meeting_minutes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_commission_member = true
  )
);

-- Policy: Authenticated users can view meeting minutes
CREATE POLICY "Authenticated users can view meeting minutes"
ON public.meeting_minutes
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Commission members can manage meeting minutes files
CREATE POLICY "Commission members can manage meeting minutes files"
ON public.meeting_minutes_files
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_commission_member = true
  )
);

-- Policy: Authenticated users can view meeting minutes files
CREATE POLICY "Authenticated users can view meeting minutes files"
ON public.meeting_minutes_files
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create storage bucket for meeting minutes
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-minutes', 'meeting-minutes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Authenticated users can view meeting minutes files
CREATE POLICY "Authenticated users can view meeting minutes files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'meeting-minutes' AND auth.role() = 'authenticated');

-- Storage policy: Commission members can upload meeting minutes files
CREATE POLICY "Commission members can upload meeting minutes files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'meeting-minutes' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_commission_member = true
  )
);

-- Storage policy: Commission members can delete meeting minutes files
CREATE POLICY "Commission members can delete meeting minutes files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meeting-minutes'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_commission_member = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_meeting_minutes_updated_at
BEFORE UPDATE ON public.meeting_minutes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();