# /feature — Scaffold de Nova Feature

Cria todos os arquivos MVC para uma nova feature seguindo a arquitetura do projeto.

## Uso

```
/feature <nome-da-feature>
```

Exemplo: `/feature billing`

## O que executar

Dado o nome `$ARGUMENTS`, crie os seguintes arquivos na ordem:

### 1. Model — Tipos (`src/features/$ARGUMENTS/models/$ARGUMENTS.types.ts`)

```ts
// Tipos e interfaces da feature
// Inclua: entidade principal, payload de criação, payload de atualização, estado do hook
```

### 2. Model — Service (`src/features/$ARGUMENTS/services/$ARGUMENTS.service.ts`)

```ts
// Funções async puras para acesso ao Supabase
// Padrão: getAll, getById, create, update, remove
// Valide entradas com zod antes de qualquer operação
// Retorne apenas os campos necessários (sem select('*'))
```

### 3. Controller — Hook (`src/features/$ARGUMENTS/controllers/use$ARGUMENTS_PASCAL.ts`)

```ts
// Hook que orquestra estado e services
// Exponha: dados formatados, handlers tipados, isLoading, error
// Nunca contenha JSX
```

### 4. View — Page (`src/features/$ARGUMENTS/views/$ARGUMENTS_PASCAL.Page.tsx`)

```tsx
// Componente visual puro
// Importe apenas do controller (hook)
// Use Shadcn UI + Tailwind
// Mobile-first, dark mode, acessibilidade
```

### 5. View — Index (`src/features/$ARGUMENTS/index.ts`)

```ts
// Barrel export da feature — exporte apenas o necessário externamente
```

Após criar os arquivos, liste-os e confirme que o fluxo de dependência está correto:
`View → Controller → Service → Supabase`
