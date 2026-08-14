# Contexto do Projeto

> Leia `docs/prd.md` antes de qualquer decisão de arquitetura ou negócio.

## Stack e Comandos

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js LTS |
| Package manager | `pnpm` — nunca `npm` ou `yarn` |
| Frontend | React + TypeScript + Vite |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Pagamentos | Stripe |
| E-mail | Brevo |
| Automações | n8n self-hosted |
| Estilo | Tailwind CSS + Shadcn UI (Radix UI) |

```bash
pnpm install        # instalar dependências
pnpm dev            # dev server → http://localhost:3000
pnpm build          # build de produção
pnpm start          # servidor de produção (PM2 / Docker)
pnpm tsc --noEmit   # checar tipos sem build
pnpm lint           # ESLint
pnpm test --run     # rodar testes uma vez
pnpm test           # watch mode
```

## MCPs Disponíveis

Consulte via MCP antes de escrever código de integração:

- `context7` — documentação atualizada de qualquer lib
- `supabase` — Auth, RLS, Storage, Edge Functions, Realtime
- `stripe` — produtos, preços, checkout, webhooks
- `brevo` — templates de e-mail, envio transacional
- `n8n` — workflows e automações

## Regras Globais

- Commits com **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`)
- Zero secrets no código — apenas `.env` / `.env.local` (nunca commitar)
- Deploy: `pnpm build` → `pnpm start` → PM2 ou Docker — **nunca Vercel**
- Rollback por tag Git semântica: `v1.0.0`, `v2.0.0`, `v3.0.0`
- Não instale novos pacotes sem solicitação explícita
