# MEMORY — Loja Amor da Pátria

> Índice de memórias persistentes do projeto. Atualizar a cada sessão com info nova e durável.
> Não repetir o que já consta em `CLAUDE.md`, `docs/prd.md` ou `docs/backlog.md`.

---

## Sessões

- [Sessão 2026-04-15](sessao_atual.md) — Planejamento: geração do CLAUDE.md com 16 seções; Sprint 1 mapeado; zero código alterado
- [Sessão 2026-04-26](sessao_atual.md) — Integração Brevo completa; tag `v1.0.1`; Sprint 1 débito técnico ainda aberto

---

## Decisões arquiteturais em aberto

| Decisão | Contexto | Sprint |
|---------|---------|--------|
| Parser OFX: `ofx-js` vs implementação própria | Bundle vs controle; OFX é XML-like com poucos campos necessários | Sprint 5 |
| PDF: `jsPDF` (client) vs Edge Function (server) | Edge garante layout consistente; client é mais simples de deploy | Sprint 5 |
| Virtualização: `react-window` vs `react-virtual` | Benchmark com listas reais da loja antes de decidir | Sprint 3 |

---

## Decisões arquiteturais tomadas

| Decisão | Motivo | Data |
|---------|--------|------|
| Brevo via SMTP para auth emails (não API REST direta) | Supabase SMTP centraliza confirmação + reset sem duplicar lógica | 2026-04-26 |
| Edge Function para notificação de senha alterada | Chave de API server-side, nunca no bundle do cliente | 2026-04-26 |
| SMTP username Brevo = `a9555c001@smtp-brevo.com` | Login interno gerado pelo Brevo; não é o e-mail da conta Google | 2026-04-26 |

---

## Arquivos críticos do Sprint 1 (ainda não alterados)

| Arquivo | Problema | Story | Prioridade |
|---------|---------|-------|-----------|
| `src/integrations/supabase/client.ts` | URL e anon key hardcoded, não usa `import.meta.env` | H-1 | Alta |
| `src/pages/CommissionVisitors.tsx` linhas 295–408 | Campos de telefone duplicados no formulário | G-4 | Alta |
| `src/pages/CommissionSecretary.tsx` | 6 chamadas `supabase.from()` diretas na View | A-1 | Alta |
| `src/components/chancellery/ChancelleryAttendanceReport.tsx` | 4 selects Supabase diretos na View | A-2 | Alta |
| `src/pages/UserWorks.tsx` | Mutations diretas na View sem passar pelo hook | A-3 | Alta |
| `src/hooks/useFinancialData.ts` | 14 instâncias `as any` | B-1 | Média |
| `src/hooks/useSecretary.ts` | 6 instâncias `as any` | B-2 | Média |
| `src/hooks/useHospitalaria.ts` | 4 instâncias `as any` | B-3 | Média |
| `src/hooks/useAuditLog.ts` | 2 instâncias `as any` | B-3 | Média |

---

## Preferências do usuário (Ricardo Lopes)

- Respostas sempre em **português brasileiro**
- Tom direto e técnico — sem rodeios, sem emojis, sem resumos prolixos
- Prefere ver ação e código; não quer explicação teórica antes do resultado
- Referências a arquivos como links clicáveis `[arquivo.ts](caminho/arquivo.ts)`
- `pnpm` sempre — nunca `npm` ou `yarn`

---

## Infraestrutura configurada

| Serviço | Status | Detalhe |
|---------|--------|---------|
| Supabase projeto | ✅ | `sbpokljexxmwxuudhhmz` — CLI vinculado |
| Brevo SMTP | ✅ | `smtp-relay.brevo.com:587` — login `a9555c001@smtp-brevo.com` |
| Secret `BREVO_API_KEY` | ✅ | Configurado no Supabase como secret da Edge Function |
| Secret `BREVO_SENDER_EMAIL` | ✅ | Configurado no Supabase como secret da Edge Function |
| Edge Function `send-email` | ✅ | Deployada em 2026-04-26 |
| Templates de e-mail | ⚠️ | HTML fornecido — colar manualmente no Supabase Dashboard |
