-- Remove fixed date fields from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS birth_date,
DROP COLUMN IF EXISTS initiation_date,
DROP COLUMN IF EXISTS spouse_name,
DROP COLUMN IF EXISTS spouse_birth_date;

-- Update commemorative_dates table to support all types of dates
-- Add more date types to support all commemorative occasions
COMMENT ON COLUMN public.commemorative_dates.date_type IS 
'Types: brother_birthday, initiation, spouse_birthday, child, wedding_anniversary, other';