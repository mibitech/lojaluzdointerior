-- NOTA (schema drift): cria policies granulares (INSERT/UPDATE/DELETE) para
-- commission members em events, activities, worshipful_masters e profiles.
-- São redundantes com as policies "FOR ALL" equivalentes já criadas em
-- 20251107134258_e64e1cb5-9a8b-4910-9a6a-98fee6da0669.sql (FOR ALL cobre
-- INSERT/UPDATE/DELETE), exceto "Commission members can update any profile"
-- em profiles, que não tem equivalente posterior — mas depende de profiles
-- existir, o que só ocorre na migration de novembro.
-- Neutralizado durante a duplicação para lojaluzdointerior em 2026-08-13.
SELECT 1;
