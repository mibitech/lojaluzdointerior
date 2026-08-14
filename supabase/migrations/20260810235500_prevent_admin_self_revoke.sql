-- Impede que um administrador revogue o próprio papel
-- Criado em: 20260810235500
--
-- Sem esta restrição, o admin pode remover o próprio 'admin' pela tela de
-- Acessos e ficar sem permissão para reconceder — se for o único admin,
-- a gestão de acessos fica inacessível e a correção exige SQL manual.
-- (Ocorreu em produção: os papéis de rlcunha@gmail.com foram removidos e
-- precisaram ser restaurados pelo SQL Editor.)

BEGIN;

DROP POLICY IF EXISTS "Admins can revoke roles" ON public.user_roles;

CREATE POLICY "Admins can revoke roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()) AND user_id <> auth.uid());

COMMIT;
