-- Tornar campos de arquivo opcionais na tabela articles
ALTER TABLE public.articles 
  ALTER COLUMN file_url DROP NOT NULL,
  ALTER COLUMN file_name DROP NOT NULL,
  ALTER COLUMN file_type DROP NOT NULL;