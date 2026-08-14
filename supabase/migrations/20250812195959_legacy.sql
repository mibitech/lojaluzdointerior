-- NOTA (inconsistência histórica): este arquivo insere dados mock em
-- public.activities, mas essa tabela só é criada em
-- 20251107134258_e64e1cb5-9a8b-4910-9a6a-98fee6da0669.sql (timestamp posterior) —
-- schema drift do projeto original. Neutralizado durante a duplicação para
-- lojaluzdointerior em 2026-08-13; os dados reais da tabela activities são
-- copiados na etapa de cópia de dados, tornando este INSERT de mock redundante.
SELECT 1;
