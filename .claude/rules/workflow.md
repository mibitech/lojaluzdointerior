# Workflow — Git, Qualidade e Deploy

## Git

Commits com **Conventional Commits**:

```
feat(auth): adicionar login com magic link
fix(billing): corrigir cálculo de desconto no checkout
refactor(dashboard): extrair lógica de filtros para hook
test(auth): adicionar testes de integração para useAuth
chore(deps): atualizar Supabase JS para v2.39
```

Tipos: `feat` · `fix` · `refactor` · `test` · `chore` · `docs` · `perf` · `style`

Escopo: nome da feature afetada (`auth`, `billing`, `ui`, `supabase`)

Use `/commit` para gerar commits com pré-verificações automáticas.

## Pré-Requisitos para Todo Commit

```bash
pnpm tsc --noEmit   # zero erros de tipo
pnpm lint           # zero warnings ESLint
pnpm test --run     # testes passando
```

## Checklist de QA por Épico

Antes de marcar um épico como concluído:

- [ ] Critérios de aceite do `docs/prd.md` verificados
- [ ] `pnpm build` sem erros
- [ ] Fluxo crítico testado manualmente no browser (porta 3000)
- [ ] Migrations aplicadas e RLS configurado
- [ ] Sem secrets no histórico Git
- [ ] `docs/prd.md` atualizado se decisões mudaram
- [ ] Decisões não óbvias registradas em `docs/decisions/`

## Deploy

```bash
pnpm build    # gera dist/
pnpm start    # server de produção
# Gerenciado por PM2 ou Docker — nunca Vercel
```

Tags de release: `git tag v1.0.0 && git push origin v1.0.0`

## Épicos

Use `/epic <nome>` para decompor um épico do PRD em plano de execução ordenado antes de começar qualquer implementação.
