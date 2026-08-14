-- NOTA (schema drift + obsoleto): alterava handle_new_user() para setar
-- profiles.role = 'visitor' em vez de 'member'. Depende de profiles existir
-- (só ocorre na migration de novembro) e a coluna profiles.role foi
-- removida definitivamente em 20260810234500_drop_profiles_role.sql — o
-- conceito de role em profiles é obsoleto (fonte única hoje é
-- user_roles.role).
-- Neutralizado durante a duplicação para lojaluzdointerior em 2026-08-13.
SELECT 1;
