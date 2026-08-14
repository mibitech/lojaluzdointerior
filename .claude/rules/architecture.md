# Arquitetura — MVC para React/Vite

## Fluxo de Dependência — Nunca Violar

```
View → Controller (hook) → Service → Supabase / API externa
 [V]        [C]               [M]          [externo]
```

Qualquer violação encontrada deve ser refatorada antes de continuar.

## Estrutura de Diretórios

```
src/
├── features/{feature}/
│   ├── models/
│   │   └── {feature}.types.ts      # [M] tipos, interfaces, schemas zod
│   ├── services/
│   │   └── {feature}.service.ts    # [M] acesso Supabase / APIs — funções async puras
│   ├── controllers/
│   │   └── use{Feature}.ts         # [C] hook: orquestra estado + services → expõe à View
│   └── views/
│       ├── {Feature}Page.tsx       # [V] página principal
│       └── {Feature}Card.tsx       # [V] componente visual
├── components/ui/                  # [V] primitivos Shadcn globais
├── lib/supabase/client.ts          # [M] instância do cliente Supabase
└── types/                          # [M] tipos globais compartilhados
```

## Regras por Camada

**Model** (`models/` e `services/`)
- Tipos em `{feature}.types.ts`; validação de entrada com zod
- Services: funções async puras — sem estado React, sem JSX
- Nunca importados diretamente em componentes View

**Controller** (`controllers/`)
- Sempre um custom hook: `use{Feature}.ts`
- Gerencia `useState`, `useReducer`, `useEffect`, erros
- Expõe apenas dados formatados + handlers tipados
- Nunca contém JSX

**View** (`views/` e `components/`)
- Apenas props tipadas — sem fetch, sem Supabase direto
- Sem `useEffect` para lógica de negócio
- Shadcn UI + Tailwind; mobile-first; dark mode

## Nomenclatura

- Diretórios: `kebab-case`
- Services: `{feature}.service.ts`
- Controllers: `use{Feature}.ts`
- Views: `{Feature}Page.tsx`, `{Feature}Card.tsx`, `{Feature}Form.tsx`
- Named exports em todos os módulos
- Booleanos: `isLoading`, `hasError`, `canSubmit`
- Evite `enum`; use `as const` ou uniões de strings

## Ao Criar Nova Feature — Ordem Obrigatória

1. `{feature}.types.ts` — defina os tipos
2. `{feature}.service.ts` — implemente o acesso a dados
3. `use{Feature}.ts` — implemente o controller
4. `{Feature}Page.tsx` — implemente a view
5. `index.ts` — barrel export seletivo

Use `/feature <nome>` para scaffoldar automaticamente.
