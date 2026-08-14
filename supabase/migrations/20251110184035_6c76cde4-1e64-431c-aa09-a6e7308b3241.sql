-- Enable realtime for commemorative_dates table
ALTER TABLE commemorative_dates REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE commemorative_dates;