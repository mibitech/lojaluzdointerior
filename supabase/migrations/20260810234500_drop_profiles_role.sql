-- Remove a coluna obsoleta profiles.role
-- Criado em: 20260810234500
--
-- A fonte de verdade de papel é user_roles.role (lida pelo AuthContext).
-- profiles.role não era lida nem escrita por nenhum código: o trigger
-- handle_new_user insere apenas user_id, full_name e email. Os valores
-- remanescentes vinham de importação antiga e estavam defasados —
-- 2 vazios e 3 truncados ("member...") —, o que a tornava uma fonte de
-- verdade duplicada e enganosa sobre quem tem acesso.
--
-- Verificado antes do drop: nenhuma policy, função, view, constraint ou
-- índice referenciava a coluna.

BEGIN;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

COMMIT;
