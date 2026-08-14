# /migration — Criar Migration Supabase

Cria uma migration SQL com timestamp, seguindo as convenções do projeto.

## Uso

```
/migration <descricao-da-migration>
```

Exemplo: `/migration create_orders_table`

## O que executar

1. Gere o timestamp no formato `YYYYMMDDHHmmss` (horário atual UTC)
2. Crie o arquivo `supabase/migrations/{timestamp}_$ARGUMENTS.sql`
3. Inclua no arquivo o template abaixo, preenchido conforme o contexto da migration:

```sql
-- Migration: $ARGUMENTS
-- Criado em: {timestamp}

-- ↑ UP
BEGIN;

-- [Escreva o SQL aqui]
-- Exemplo para nova tabela:
-- CREATE TABLE IF NOT EXISTS public.{tabela} (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- RLS obrigatório para toda nova tabela
-- ALTER TABLE public.{tabela} ENABLE ROW LEVEL SECURITY;

-- Políticas RLS mínimas:
-- CREATE POLICY "Usuários veem apenas seus dados"
--   ON public.{tabela} FOR SELECT
--   USING (auth.uid() = user_id);

COMMIT;
```

4. Lembre-me de:
   - Habilitar RLS se a migration cria uma nova tabela
   - Criar índices para colunas usadas em filtros (`WHERE`, `ORDER BY`)
   - Aplicar com `supabase db push` ou `supabase migration up`
   - Testar a policy RLS com um usuário de teste antes de ir para produção
