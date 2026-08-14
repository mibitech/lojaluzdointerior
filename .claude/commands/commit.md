# /commit — Criar Commit com Conventional Commits

Prepara e executa um commit seguindo os padrões do projeto.

## Uso

```
/commit
```

## O que executar

### 1. Verificação Pré-Commit

Execute em sequência e pare se qualquer um falhar:

```bash
pnpm tsc --noEmit      # zero erros de TypeScript
pnpm lint              # zero erros de ESLint
pnpm test --run        # testes passando (se existirem)
```

### 2. Análise do Diff

- Rode `git diff --staged` para ver o que será commitado
- Se nada estiver staged, rode `git status` e pergunte quais arquivos incluir
- Nunca inclua: `.env`, `.env.local`, arquivos de build (`dist/`), `node_modules/`

### 3. Formato da Mensagem

```
<tipo>(<escopo>): <descrição curta em português>

[corpo opcional — explique o PORQUÊ, não o O QUÊ]

[rodapé opcional — Breaking changes, closes #issue]
```

**Tipos:**
| Tipo | Quando usar |
|------|------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `test` | Adição ou correção de testes |
| `chore` | Build, deps, config — sem mudança de código de produção |
| `docs` | Documentação |
| `perf` | Melhoria de performance |
| `style` | Formatação, sem mudança de lógica |

**Escopo:** nome da feature ou módulo afetado (ex: `auth`, `billing`, `ui`)

**Exemplos:**
```
feat(billing): adicionar checkout via Stripe com webhook de confirmação
fix(auth): corrigir redirect após login em rotas protegidas
chore(deps): atualizar Supabase JS para v2.39
```

### 4. Executar o Commit

```bash
git commit -m "$(cat <<'EOF'
<mensagem gerada>
EOF
)"
```
