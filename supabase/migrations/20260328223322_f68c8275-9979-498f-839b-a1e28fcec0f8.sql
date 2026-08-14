ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active_member boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_dormant boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_redeemed boolean NOT NULL DEFAULT false;