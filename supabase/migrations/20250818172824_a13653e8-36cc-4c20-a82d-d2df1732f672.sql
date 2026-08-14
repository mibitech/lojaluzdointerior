-- NOTA (schema drift): adiciona masonic_degree a study_works, mas
-- study_works é recriada com essa coluna nativamente em
-- 20251107134258_e64e1cb5-9a8b-4910-9a6a-98fee6da0669.sql. O UPDATE de dados
-- também não se aplica (dados mock).
-- Neutralizado durante a duplicação para lojaluzdointerior em 2026-08-13.
SELECT 1;
