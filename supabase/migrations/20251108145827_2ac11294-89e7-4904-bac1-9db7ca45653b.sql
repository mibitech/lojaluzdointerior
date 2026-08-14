-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_reads table to track which messages have been read
CREATE TABLE public.message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
-- Commission members can manage all messages
CREATE POLICY "Commission members can manage messages"
ON public.messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_commission_member = true
  )
);

-- Members can view messages sent to them or to everyone (recipient_id IS NULL)
CREATE POLICY "Members can view their messages"
ON public.messages
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    recipient_id = auth.uid() OR recipient_id IS NULL
  )
);

-- RLS Policies for message_reads
-- Users can insert their own read records
CREATE POLICY "Users can mark messages as read"
ON public.message_reads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own read records
CREATE POLICY "Users can view their read records"
ON public.message_reads
FOR SELECT
USING (auth.uid() = user_id);

-- Commission members can view all read records
CREATE POLICY "Commission members can view all read records"
ON public.message_reads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_commission_member = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();