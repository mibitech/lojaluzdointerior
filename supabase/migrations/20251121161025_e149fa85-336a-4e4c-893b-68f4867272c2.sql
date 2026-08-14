-- Add position_override column to session_attendances
ALTER TABLE public.session_attendances
ADD COLUMN position_override TEXT;