-- NOTA (schema drift do projeto original): cria study_works + bucket
-- study-documents + policies, mas study_works é inteiramente recriada em
-- 20251107134258_e64e1cb5-9a8b-4910-9a6a-98fee6da0669.sql. O bucket
-- study-documents e suas storage policies permanecem cobertos por
-- 20250812192720_legacy.sql (idempotente, com IF NOT EXISTS).
-- Neutralizado durante a duplicação para lojaluzdointerior em 2026-08-13.

-- Mantém apenas a criação do bucket (idempotente), pois 192720 só cria as
-- policies, assumindo que o bucket já existe.
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-documents', 'study-documents', false)
ON CONFLICT (id) DO NOTHING;
