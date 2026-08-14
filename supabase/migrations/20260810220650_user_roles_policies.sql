-- Policies RLS para user_roles + função de checagem de admin
-- Criado em: 20260810220650
--
-- Contexto: a tabela user_roles não é criada por nenhuma migration local
-- (foi feita direto pelo dashboard), então suas policies são desconhecidas.
-- Esta migration é idempotente e segura de rodar sobre a tabela existente:
-- garante estrutura mínima, habilita RLS e define as policies necessárias
-- para a tela de Gestão de Acessos.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impede papel duplicado para o mesmo usuário; necessário para o upsert do hook.
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_unique
  ON public.user_roles (user_id, role);

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER: consultar user_roles de dentro de uma policy da própria
-- tabela causaria recursão infinita. A função quebra esse ciclo.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Cada usuário lê os próprios papéis (necessário para o AuthContext no login).
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Quem gerencia perfis enxerga todos os papéis (alimenta a tela de gestão).
DROP POLICY IF EXISTS "Managers can read all roles" ON public.user_roles;
CREATE POLICY "Managers can read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.can_manage_profiles(auth.uid()));

-- Conceder e revogar papéis é exclusivo de admin.
DROP POLICY IF EXISTS "Admins can grant roles" ON public.user_roles;
CREATE POLICY "Admins can grant roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can revoke roles" ON public.user_roles;
CREATE POLICY "Admins can revoke roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

COMMIT;
