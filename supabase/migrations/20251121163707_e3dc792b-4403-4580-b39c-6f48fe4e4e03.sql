-- Add session_id column to meeting_minutes table
ALTER TABLE public.meeting_minutes
ADD COLUMN session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_meeting_minutes_session_id ON public.meeting_minutes(session_id);

COMMENT ON COLUMN public.meeting_minutes.session_id IS 'Referência para a sessão relacionada com esta ata';