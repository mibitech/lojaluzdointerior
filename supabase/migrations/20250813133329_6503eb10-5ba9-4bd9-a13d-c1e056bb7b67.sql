-- NOTA (schema drift): adiciona masonic_degree a profiles, mas profiles é
-- inteiramente recriada com essa coluna nativamente em
-- 20251107134258_e64e1cb5-9a8b-4910-9a6a-98fee6da0669.sql (sem o CHECK
-- constraint 1/2/3, que não é reintroduzido em migration posterior).
-- Neutralizado durante a duplicação para lojaluzdointerior em 2026-08-13.
SELECT 1;
