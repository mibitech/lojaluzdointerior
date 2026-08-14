-- Add member_status column with default 'Ativo'
ALTER TABLE public.profiles ADD COLUMN member_status text NOT NULL DEFAULT 'Ativo';

-- Migrate existing data
UPDATE public.profiles SET member_status = 
  CASE 
    WHEN is_dormant = true THEN 'Adormecido'
    WHEN is_redeemed = true THEN 'Remido'
    WHEN is_active_member = true THEN 'Ativo'
    ELSE 'Ativo'
  END;

-- Drop the old boolean columns
ALTER TABLE public.profiles DROP COLUMN is_active_member;
ALTER TABLE public.profiles DROP COLUMN is_dormant;
ALTER TABLE public.profiles DROP COLUMN is_redeemed;