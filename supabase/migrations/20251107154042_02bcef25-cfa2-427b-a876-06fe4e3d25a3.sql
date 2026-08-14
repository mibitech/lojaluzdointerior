-- Create storage buckets for activities and events
INSERT INTO storage.buckets (id, name, public) 
VALUES ('activities', 'activities', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for activities bucket
CREATE POLICY "Public can view activity images"
ON storage.objects FOR SELECT
USING (bucket_id = 'activities');

CREATE POLICY "Authenticated users can upload activity images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'activities' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update activity images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'activities' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete activity images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'activities' 
  AND auth.role() = 'authenticated'
);

-- Create storage policies for events bucket
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'events');

CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'events' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update event images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'events' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete event images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'events' 
  AND auth.role() = 'authenticated'
);

-- Create table for activity images
CREATE TABLE IF NOT EXISTS public.activity_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity_images
ALTER TABLE public.activity_images ENABLE ROW LEVEL SECURITY;

-- Create policies for activity_images
CREATE POLICY "Public can view activity images"
ON public.activity_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.activities 
    WHERE id = activity_id AND is_public = true
  )
  OR auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can insert activity images"
ON public.activity_images FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update activity images"
ON public.activity_images FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete activity images"
ON public.activity_images FOR DELETE
USING (auth.role() = 'authenticated');

-- Create table for event images
CREATE TABLE IF NOT EXISTS public.event_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on event_images
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;

-- Create policies for event_images
CREATE POLICY "Public can view event images"
ON public.event_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND is_public = true
  )
  OR auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can insert event images"
ON public.event_images FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update event images"
ON public.event_images FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete event images"
ON public.event_images FOR DELETE
USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_activity_images_activity_id ON public.activity_images(activity_id);
CREATE INDEX idx_activity_images_display_order ON public.activity_images(display_order);
CREATE INDEX idx_event_images_event_id ON public.event_images(event_id);
CREATE INDEX idx_event_images_display_order ON public.event_images(display_order);