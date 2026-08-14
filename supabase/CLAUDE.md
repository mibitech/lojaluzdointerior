# supabase/ — Backend (Supabase: DB, Auth, Storage, Edge Functions)

Regras específicas do diretório Supabase. As regras globais estão no `CLAUDE.md` raiz.

---

## Migrations

Nomenclatura obrigatória: `{timestamp}_{descricao_snake_case}.sql`

```bash
# Gerar timestamp
date -u +"%Y%m%d%H%M%S"

# Exemplos de nome
20240115143000_create_orders_table.sql
20240116090000_add_stripe_customer_id_to_users.sql
```

Use `/migration <descricao>` para criar automaticamente com o template correto.

### Template Padrão

```sql
-- Descrição da migration
-- Criado em: {timestamp}

BEGIN;

-- Schema
CREATE TABLE IF NOT EXISTS public.{tabela} (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para colunas de filtro comuns
CREATE INDEX ON public.{tabela} (user_id);
CREATE INDEX ON public.{tabela} (created_at DESC);

-- RLS — obrigatório para toda nova tabela
ALTER TABLE public.{tabela} ENABLE ROW LEVEL SECURITY;

-- Policies mínimas
CREATE POLICY "Usuários leem seus dados"
  ON public.{tabela} FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus dados"
  ON public.{tabela} FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam seus dados"
  ON public.{tabela} FOR UPDATE
  USING (auth.uid() = user_id);

COMMIT;
```

## RLS — Row Level Security

- **Nunca crie tabela sem RLS** — habilite no mesmo migration que cria a tabela
- Policies usam `auth.uid()` — nunca dados passados pelo client
- Toda tabela tem ao menos uma policy por operação relevante (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
- Teste as policies com um usuário real antes de ir para produção:

```sql
-- Teste de policy RLS
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "uuid-do-usuario"}';
SELECT * FROM public.{tabela}; -- deve retornar apenas os dados do usuário
```

## Edge Functions

Localização: `supabase/functions/{nome}/index.ts`

```typescript
// Template de Edge Function
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'
import { z } from 'https://deno.land/x/zod/mod.ts'

const schema = z.object({ /* defina o schema */ })

serve(async (req) => {
  // 1. Parse e valide o body com zod — sempre
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error }), { status: 400 })
  }

  // 2. Use service_role apenas aqui — nunca no client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 3. Lógica de negócio...

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
```

Regras:
- Valide toda entrada com zod antes de qualquer operação
- `service_role` apenas em Edge Functions — nunca no frontend
- Retorne apenas os campos necessários
- Trate erros explicitamente — sem `catch` vazio

## Auth

- Use `supabase.auth.getUser()` server-side para verificar sessão (nunca `getSession()` em contexto seguro)
- Rotas protegidas verificam a sessão antes de renderizar — sem depender só do redirect
- Refresh de token gerenciado automaticamente pelo cliente Supabase JS
- Magic link e OAuth configurados via Supabase Dashboard — sem implementação manual

## Queries — Boas Práticas

```typescript
// Sempre selecione colunas explícitas
const { data } = await supabase
  .from('orders')
  .select('id, status, total, created_at')  // nunca select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(0, 19)  // paginação obrigatória em listas

// Índices: toda coluna em .eq(), .order(), .filter() deve ter índice
```

## Storage

- Buckets com RLS habilitado (mesmo padrão das tabelas)
- Prefixo de path por `user_id`: `{user_id}/{filename}` para isolar arquivos por usuário
- URLs públicas apenas para assets genuinamente públicos; signed URLs para privados
