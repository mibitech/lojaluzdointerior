-- NOTA (duplicação de migration histórica): este arquivo recriava o bucket
-- 'study-documents' e as mesmas 4 storage policies já criadas por
-- 20250812191843_legacy.sql (mesmos nomes de policy, mesmo propósito).
-- Neutralizado durante a duplicação do projeto para lojaluzdointerior em 2026-08-13
-- para evitar erro "policy already exists" no db push.
SELECT 1;
