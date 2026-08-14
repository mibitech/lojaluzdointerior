-- Adiciona o campo CIM (Código de Identificação Maçônica) à tabela profiles
-- CIM: 6 dígitos numéricos, único por membro

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cim TEXT;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_cim_format
  CHECK (cim IS NULL OR cim ~ '^\d{6}$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_cim_unique
  ON public.profiles (cim)
  WHERE cim IS NOT NULL;

COMMIT;
