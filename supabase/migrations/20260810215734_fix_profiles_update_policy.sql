-- Corrige a policy de UPDATE em profiles
-- Criado em: 20260810215734
--
-- Problema: a policy "Commission members can update profiles" declarava apenas
-- USING, sem WITH CHECK. Em UPDATE, o Postgres reaproveita a expressão de USING
-- para validar a linha resultante. Como essa expressão faz subselect na própria
-- tabela profiles (que tem RLS), a policy fica autorreferente e o UPDATE afeta
-- zero linhas sem retornar erro — gravações silenciosamente descartadas
-- (sintoma observado: campo CIM não persistia).
--
-- Solução: função SECURITY DEFINER, que consulta profiles/user_roles ignorando
-- RLS e quebra a recursão, mais WITH CHECK explícito na policy.

BEGIN;

-- Autorizador central: admin (user_roles) ou membro de comissão (profiles).
-- SECURITY DEFINER evita a avaliação recursiva de RLS sobre profiles.
CREATE OR REPLACE FUNCTION public.can_manage_profiles(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role IN ('admin', 'commission_member')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id
      AND p.is_commission_member = true
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_manage_profiles(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_profiles(UUID) TO authenticated;

DROP POLICY IF EXISTS "Commission members can update profiles" ON public.profiles;

CREATE POLICY "Commission members can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.can_manage_profiles(auth.uid()))
WITH CHECK (public.can_manage_profiles(auth.uid()));

-- Mantém a capacidade de o membro editar o próprio perfil.
-- WITH CHECK impede que ele transfira o registro para outro user_id.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

COMMIT;
