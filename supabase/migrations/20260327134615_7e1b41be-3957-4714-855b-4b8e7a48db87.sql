ALTER TABLE public.meeting_minutes
  ADD COLUMN status text NOT NULL DEFAULT 'Pendente',
  ADD COLUMN approved_at timestamp with time zone DEFAULT NULL;