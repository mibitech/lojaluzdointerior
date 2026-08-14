# Loja Amor da Pátria — CLAUDE.md

> **Fonte da verdade:** `docs/prd.md` · `docs/backlog.md` · `docs/decisions/`
> Data: 2026-08-10 · Fase atual: **Sprint 1 — Débito Crítico**

---

## 1. 📋 REFERÊNCIAS OBRIGATÓRIAS

| Documento | Caminho | Finalidade |
|-----------|---------|-----------|
| PRD | `docs/prd.md` | Requisitos, épicos, regras de negócio |
| Backlog | `docs/backlog.md` | User stories, sprints, priorização |
| Arquitetura | `.claude/rules/architecture.md` | Fluxo MVC obrigatório |
| Segurança | `.claude/rules/security.md` | Regras de hardening |
| Contexto | `.claude/rules/context.md` | Stack, MCPs, comandos |
| Workflow | `.claude/rules/workflow.md` | Git, QA, deploy |
| Memória | `C:\Users\rlcun\.claude\projects\c--Projetos-lojaamordapatria\memory\MEMORY.md` | Contexto persistente entre sessões |

**NUNCA tome decisões de arquitetura ou negócio sem consultar `docs/prd.md` primeiro.**

---

## 2. 🎯 OBJETIVO GERAL

| Item | Valor |
|------|-------|
| **Fase atual** | Sprint 1 — Débito Crítico |
| **Meta** | Eliminar violações MVC, remover `any` nos hooks críticos, corrigir bugs de UX e verificar segurança de variáveis de ambiente |
| **Tag alvo** | `v1.1.0` |
| **Pré-requisito** | `pnpm tsc --noEmit` zero erros · `pnpm lint` zero warnings · build sem falhas |

### Critérios de conclusão do Sprint 1
- [ ] Zero chamadas `supabase.from()` diretas em componentes View
- [ ] Zero `as any` nos hooks `useFinancialData`, `useSecretary`, `useHospitalaria`, `useAuditLog`
- [ ] Formulário de visitantes sem campos duplicados
- [x] `client.ts` usa apenas `import.meta.env.VITE_*`

---

## 3. 📊 ROADMAP

| Fase | Período | Foco | Tag | Status |
|------|---------|------|-----|--------|
| Sprint 1 | Semana 1–2 | Débito crítico: MVC + TypeScript + Bugs | `v1.1.0` | 🚀 Em andamento |
| Sprint 2 | Semana 3–4 | Testes unitários + E2E + Error Boundaries + Code Splitting | `v1.2.0` | ⏳ Planejado |
| Sprint 3 | Semana 5–6 | Performance + Hardening de segurança + CI/CD | `v1.3.0` | ⏳ Planejado |
| Sprint 4 | Semana 7–8 | CRUD completo + UX mobile + Automações e-mail | `v1.4.0` | ⏳ Planejado |
| Sprint 5 | Semana 9–10 | Conciliação bancária: importação + tela + match automático | `v2.0.0` | ⏳ Planejado |
| Sprint 6 | Semana 11 | Conciliação: fechamento mensal + histórico + PDF | `v2.1.0` | ⏳ Planejado |

---

## 4. 🏢 CONTEXTO DO NEGÓCIO

### Problema & Solução
As operações de uma loja maçônica dependem de processos administrativos complexos — controle de frequência, atas, tesouraria, correspondências e gestão de membros — tipicamente feitos com planilhas, e-mails e papel. O sistema **Loja Amor da Pátria** digitaliza e centraliza tudo, garantindo rastreabilidade e acesso controlado por papel.

### Público-alvo

| Papel | Responsabilidades |
|-------|------------------|
| `admin` | Aprovação de membros, acesso total, KPIs executivos |
| `secretary` | Documentos, convocações, atas, certificados, correspondências |
| `member` | Agenda, documentos próprios, mensagens, perfil, frequência |
| *Tesoureiro (derivado)* | Transações financeiras, relatórios de inadimplência, conciliação bancária |
| *Chanceler (derivado)* | Documentação oficial, relatórios de presença e visitantes |
| *Hospitaleiro (derivado)* | Casos sociais, visitas, fundo de beneficência |

### OKRs

| Objetivo | KR | Métrica |
|----------|----|---------|
| Eliminar processos manuais | 8 comissões digitalizadas | 100% dos fluxos cobertos no PRD |
| Controle de acesso auditado | RLS em 100% das tabelas | Zero tabela sem policy definida |
| Visibilidade financeira | Dashboard em tempo real | Saldo, inadimplência, conciliação disponíveis |
| Histórico digital preservado | Documentos e atas em storage | 100% dos uploads com URL assinada |

---

## 5. 🏗️ REGRAS GLOBAIS

### Commits (Conventional Commits obrigatório)

```
feat(auth): adicionar login com magic link
fix(finance): corrigir cálculo de saldo
refactor(sessions): extrair lógica para hook
test(auth): adicionar testes de integração
chore(deps): atualizar Supabase JS para v2.39
```

Tipos: `feat` · `fix` · `refactor` · `test` · `chore` · `docs` · `perf` · `style`
Escopo: nome da feature (`auth`, `finance`, `secretary`, `sessions`, `ui`)

Use `/commit` para gerar commits com pré-verificações automáticas.

### Segurança (não negociável)
- **Zero secrets no código** — apenas `.env` / `.env.local` (nunca commitar)
- **RLS em todas as tabelas** — habilitar na criação, nunca depois
- **Sem `select('*')`** em produção — colunas explícitas sempre
- **`service_role` nunca em `src/`** — apenas em Edge Functions
- Inputs validados com **Zod** antes de qualquer persistência

### Deploy
```bash
pnpm build    # gera dist/
pnpm start    # servidor de produção
# PM2 ou Docker — NUNCA Vercel
# Rollback: git tag v1.0.0 && git push origin v1.0.0
```

### QA — Pré-requisitos para todo PR
```bash
pnpm tsc --noEmit   # zero erros de tipo
pnpm lint           # zero warnings ESLint
pnpm test --run     # testes passando
pnpm build          # build sem falhas
```

### Tabela de Agentes Disponíveis

| Agente | Quando usar |
|--------|-------------|
| `Explore` | Mapear codebase, encontrar arquivos por padrão, entender fluxos |
| `Plan` | Desenhar estratégia de implementação antes de codar |
| `general-purpose` | Pesquisa multi-etapa, buscas abertas no codebase |
| `claude-code-guide` | Dúvidas sobre Claude Code CLI, SDK, hooks, MCP |
| `/feature <nome>` | Scaffoldar nova feature seguindo arquitetura MVC |
| `/commit` | Gerar commit com Conventional Commits + pré-verificações |
| `/security-check` | Auditoria completa de segurança antes de PR |
| `/review` | Revisão de código e conformidade com regras |
| `/migration` | Criar migration Supabase com RLS e tipos |
| `/epic <nome>` | Decompor épico do PRD em plano de execução |

---

## 6. 📌 STATUS DO PROJETO

### ✅ Concluído (Épicos do PRD implementados)
- Autenticação e gestão de perfil (login, cadastro, aprovação, roles)
- Secretaria (documentos, convocações, certificados, correspondências)
- Financeiro (transações, dashboard, inadimplência, contas)
- Chancelaria (relatórios de frequência, membros, visitantes)
- Sessões e frequência (criação, registro de presença, calendário)
- Copo D'água (gestão de equipes por sessão)
- Hospitalaria (casos, visitas, auxílio, fundo de beneficência)
- Conteúdo educacional (artigos, glossário, FAQ, livros, estudos)
- Comunicação interna (mensagens, leitura rastreada)
- Gestão e relatórios (KPIs, auditoria, venerabilíssimos)
- **E-mails transacionais via Brevo** — confirmação de cadastro, recuperação e alteração de senha (`v1.0.1`)

### ❌ Bloqueantes identificados (Sprint 1)
- Chamadas `supabase.from()` diretas em `CommissionSecretary.tsx`, `ChancelleryAttendanceReport.tsx`, `UserWorks.tsx` — viola arquitetura MVC
- 27+ usos de `as any` em hooks críticos (`useFinancialData`: 14, `useSecretary`: 6, `useHospitalaria`: 4, `useAuditLog`: 2)
- Campos de telefone duplicados no formulário de visitantes (`CommissionVisitors.tsx` linhas 295–408)

### ⚠️ Decisões em aberto
- Parser OFX para conciliação bancária: `ofx-js` (biblioteca) vs implementação própria
- Geração de PDF: `jsPDF` (client-side) vs Edge Function com HTML→PDF
- Virtualização de listas longas: `react-window` vs `react-virtual`

### 🚀 Próximos (Sprint 1 — em ordem)
1. **A-1** Extrair 6 chamadas Supabase de `CommissionSecretary.tsx` → `useSecretary.ts`
2. **A-2** Criar `useChancellery.ts` com selects de `ChancelleryAttendanceReport.tsx`
3. **A-3** Mover mutations de `UserWorks.tsx` → `useUserWorks.ts`
4. **B-1** Tipar `useFinancialData.ts` (eliminar 14x `as any`)
5. **B-2** Criar interfaces para retornos de `useSecretary.ts` (6x `as any`)
6. **B-3** Tipar `useHospitalaria.ts` e `useAuditLog.ts`
7. **G-4** Corrigir campos duplicados em `CommissionVisitors.tsx`
8. **H-1** Verificar variáveis de ambiente no `client.ts`

---

## 7. 🔑 CHAVES & CONFIGURAÇÃO

### Configuradas ✅
| Variável | Onde | Uso |
|----------|------|-----|
| `VITE_SUPABASE_URL` | `.env.local` | URL do projeto Supabase (✅ H-1 concluído — `client.ts` usa `import.meta.env`) |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` | Chave pública anon (✅ H-1 concluído) |
| `BREVO_API_KEY` | Supabase Secret | Chave SMTP Brevo para Edge Function `send-email` |
| `BREVO_SENDER_EMAIL` | Supabase Secret | E-mail remetente verificado no Brevo |

### Pendentes 🟡
| Variável | Para que | Sprint |
|----------|----------|--------|
| `VITE_STRIPE_PK` | Integração PIX/pagamentos | Sprint 6+ |
| `N8N_WEBHOOK_URL` | Automações via n8n | Sprint 4 |

### Nunca commitar ❌
```
.env
.env.local
.env.staging
.env.production
```

Verificar antes de PR: `git diff | grep -E "sk_|pk_|password\s*=|ANON_KEY"`

---

## 8. 🛠️ STACK TÉCNICA

| Camada | Tecnologia | Observação |
|--------|-----------|-----------|
| Runtime | Node.js LTS | — |
| Package manager | `pnpm` | **Nunca `npm` ou `yarn`** |
| Frontend | React 18 + TypeScript + Vite (SWC) | — |
| Estilo | Tailwind CSS + shadcn/ui (Radix UI) | Mobile-first, dark mode |
| Roteamento | React Router DOM v6 | Lazy loading a partir do Sprint 2 |
| Estado servidor | TanStack Query v5 | Cache, mutações, invalidação |
| Formulários | React Hook Form + Zod | Validação client + schema |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage + RLS) | BaaS principal |
| Gráficos | Recharts | Dashboard financeiro |
| Notificações | Sonner + shadcn Toast | Feedback de ações |
| Testes unitários | Vitest | Sprint 2 |
| Testes E2E | Playwright | Sprint 2 |
| Deploy | PM2 / Docker | **Nunca Vercel** |
| Pagamentos | Stripe | Backlog futuro |
| E-mail | Brevo | Sprint 4 |
| Automações | n8n self-hosted | Sprint 4 |

### Princípios Arquiteturais (MVC — nunca violar)

```
View → Controller (hook) → Service → Supabase / API externa
 [V]        [C]               [M]          [externo]
```

| Camada | Arquivo | Regra |
|--------|---------|-------|
| Model | `{feature}.types.ts` | Tipos, interfaces, schemas Zod — sem React |
| Model | `{feature}.service.ts` | Funções async puras — sem estado, sem JSX |
| Controller | `use{Feature}.ts` | Hook: orquestra estado + services; expõe à View |
| View | `{Feature}Page.tsx` | Apenas props tipadas — sem fetch, sem Supabase direto |

**Ordem obrigatória ao criar nova feature:** types → service → hook → page → barrel export

---

## 9. 📊 MCPs DISPONÍVEIS

| MCP | Função | Exemplos de uso |
|-----|--------|----------------|
| `context7` | Documentação atualizada de qualquer lib | "Qual a API do TanStack Query v5 para prefetch?" |
| `supabase` | Auth, RLS, Storage, Edge Functions, Realtime | Criar policy RLS, gerar tipos, verificar schema |
| `stripe` | Produtos, preços, checkout, webhooks | Gerar QR Code PIX, configurar produto |
| `brevo` | Templates de e-mail, envio transacional | Criar template de convocação, disparar e-mail |
| `n8n` | Workflows e automações | Configurar trigger de inadimplência, webhook |

### MCPs Futuros (Backlog)
- `sentry` — Observabilidade e captura de erros em produção (Sprint 3)
- `playwright` — Geração e execução de testes E2E (Sprint 2)

**Regra:** Consulte MCPs antes de escrever código de integração com serviços externos.

---

## 10. 🎯 PRÓXIMAS AÇÕES

### Sprint 1 — Débito Crítico (em andamento)

#### Épico A — Refatoração MVC
| ID | Ação | Agente | Status |
|----|------|--------|--------|
| A-1 | Extrair 6 chamadas `supabase.from()` de `CommissionSecretary.tsx` → `useSecretary.ts` | `Plan` → implementação | [ ] |
| A-2 | Criar `useChancellery.ts` com 4 selects de `ChancelleryAttendanceReport.tsx` | implementação | [ ] |
| A-3 | Mover mutations de `UserWorks.tsx` → `useUserWorks.ts` | implementação | [ ] |
| A-4 | Criar camada `services/` com funções async puras por feature | `Plan` | [ ] |
| A-5 | Auditar `src/pages/` (38 arquivos) para violações restantes | `Explore` | [ ] |

#### Épico B — TypeScript sem `any`
| ID | Ação | Agente | Status |
|----|------|--------|--------|
| B-1 | Tipar `useFinancialData.ts` — 14 instâncias `as any` | implementação | [ ] |
| B-2 | Criar interfaces para retornos de `useSecretary.ts` — 6 instâncias | implementação | [ ] |
| B-3 | Tipar `useHospitalaria.ts` (4) e `useAuditLog.ts` (2) | implementação | [ ] |

#### Bugs e Segurança
| ID | Ação | Agente | Status |
|----|------|--------|--------|
| G-4 | Corrigir campos duplicados em `CommissionVisitors.tsx` (linhas 295–408) | implementação | [ ] |
| H-1 | Verificar que `client.ts` usa apenas `import.meta.env.VITE_*` | implementação | [x] |

### Sprint 2 — Preview (próximo)
- C-1..C-3: Testes unitários dos hooks críticos (Vitest + mock Supabase)
- C-4..C-5: Testes E2E de autenticação (Playwright)
- E-1..E-3: `<FeatureErrorBoundary>` + padronização de erros nos hooks
- D-1..D-2: `React.lazy()` + `<Suspense>` em todas as rotas de comissão

---

## 11. 📝 COMUNICAÇÃO

### Perfil do usuário
- **Ricardo Lopes** — desenvolvedor e administrador da loja
- Responsável pelo produto e pela implementação
- Experiência com React/TypeScript e Supabase
- Prefere respostas em **português brasileiro**

### Idioma e estilo
- Responder **sempre em português brasileiro**
- Tom: **direto e técnico** — sem rodeios, sem emojis desnecessários
- Código: comentários em português quando a lógica não for auto-evidente
- Referências a arquivos: usar links clicáveis `[arquivo.ts](caminho/arquivo.ts)`
- Respostas curtas e objetivas — o usuário prefere ação sobre explicação

---

## 12. ✨ BOAS PRÁTICAS

- **Nunca viole o fluxo MVC** — View não acessa Supabase diretamente; use sempre o hook
- **Nunca use `select('*')`** em produção — declare colunas explicitamente
- **Nunca instale pacotes sem solicitação explícita** — discuta antes de adicionar dependências
- **Nunca commite secrets** — `.env` sempre no `.gitignore`
- **Sempre valide com Zod** antes de persistir dados vindos do usuário
- **Sempre use `pnpm`** — nunca `npm` ou `yarn`
- **Sempre derive tipos do Supabase** — use `Database['public']['Tables']['tabela']['Row']`
- **Nunca adicione comentários óbvios** — comente apenas lógica não evidente
- **Nunca adicione tratamento de erros para cenários impossíveis** — confie no framework
- **Nunca crie abstrações prematuras** — três linhas similares é melhor que abstração especulativa
- **Sempre confirme antes de ações destrutivas** — `DELETE`, `DROP`, `reset --hard`
- **Lazy load rotas de comissão** a partir do Sprint 2 (`React.lazy()` + `Suspense`)
- **Error boundary** por comissão — falha em `/finance` não deve afetar `/secretary`

---

## 13. 📚 MODELAGEM DE DADOS

### Domínio: Auth & Perfil
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Dados pessoais do membro (nome, avatar, grau, CIM, status). `is_director_member` = acesso às comissões (`/commission/*`) |
| `user_roles` | **Fonte única de papel**: `admin`, `member`, `commission_member` (enum `app_role`). Libera a área dos irmãos (`/members/*`). `profiles.role` foi removida em 2026-08-10 |

### Domínio: Secretaria
| Tabela | Descrição |
|--------|-----------|
| `secretary_documents` | Atas, editais, ofícios com URL no Storage |
| `secretary_convocations` | Convocações para sessões com data e conteúdo |
| `secretary_certificates` | Certificados emitidos por membro e tipo |
| `secretary_correspondence` | Correspondências recebidas e enviadas |

### Domínio: Financeiro
| Tabela | Descrição |
|--------|-----------|
| `financial_accounts` | Contas da loja (nome, saldo, tipo) |
| `financial_transactions` | Entradas e saídas com categoria, data e comprovante |
| `financial_account_movements` | Movimentações por conta |

### Domínio: Sessões & Frequência
| Tabela | Descrição |
|--------|-----------|
| `sessions` | Sessões maçônicas (tipo, grau, tema, data) |
| `session_attendances` | Frequência por sessão: `presente`, `ausente`, `justificado` |
| `meeting_minutes` | Atas de sessão vinculadas |
| `meeting_minutes_files` | Arquivos de atas no Storage |
| `copo_dagua_calendar` | Equipes do ágape por sessão |

### Domínio: Hospitalaria
| Tabela | Descrição |
|--------|-----------|
| `hospitalar_cases` | Casos sociais com status de acompanhamento |
| `hospitalar_visits` | Visitas agendadas e realizadas |
| `hospitalar_aid_requests` | Pedidos de auxílio com status de aprovação |
| `hospitalar_philanthropy` | Atividades filantrópicas |
| `hospitalar_beneficence_fund` | Movimentações do fundo de beneficência |

### Domínio: Eventos & Atividades
| Tabela | Descrição |
|--------|-----------|
| `events` | Eventos da loja (público ou privado) |
| `event_images` | Galeria de fotos por evento |
| `activities` | Atividades diversas da loja |
| `activity_images` | Imagens de atividades |

### Domínio: Conteúdo Educacional
| Tabela | Descrição |
|--------|-----------|
| `educational_content` | Conteúdo categorizado para membros |
| `articles` | Artigos maçônicos publicados |
| `glossary_terms` | Termos e definições do glossário |
| `faq_items` | Perguntas e respostas frequentes |
| `books` | Acervo da biblioteca com controle de empréstimo |
| `book_loans` | Empréstimos ativos e histórico |
| `users_works` | Trabalhos e estudos registrados pelos membros |
| `commemorative_dates` | Datas comemorativas maçônicas |

### Domínio: Comunicação
| Tabela | Descrição |
|--------|-----------|
| `messages` | Mensagens internas com destinatário |
| `message_reads` | Rastreamento de leitura por usuário |
| `n8n_chat_histories` | Histórico de chat com IA (futuro) |

### Domínio: Gestão
| Tabela | Descrição |
|--------|-----------|
| `audit_logs` | Log de ações críticas (quem, o quê, quando) |
| `officers` | Oficiais da loja e seus cargos |
| `worshipful_masters` | Histórico de venerabilíssimos |
| `lodge_info` | Informações institucionais da loja |
| `management_cargo_reports` | Relatórios de entrega de cargos |
| `visitors` | Visitantes registrados nas sessões |

### Domínio: Conciliação Bancária (Sprint 5–6)
| Tabela | Descrição |
|--------|-----------|
| `bank_statements` | Cabeçalho da importação de extrato por mês/conta |
| `bank_statement_entries` | Lançamentos individuais do extrato bancário |
| `bank_reconciliations` | Vínculos entre entradas do extrato e transações do sistema |

---

## 14. 🚀 QUANDO ATUALIZAR ESTE ARQUIVO

Atualize o `CLAUDE.md` sempre que ocorrer:

| Gatilho | O que atualizar |
|---------|----------------|
| Início de novo sprint | Seções "Objetivo Geral", "Status do Projeto", "Próximas Ações" |
| Nova decisão técnica | Seção "Decisões em aberto" → registrar em `docs/decisions/` |
| Nova tabela no Supabase | Seção "Modelagem de Dados" |
| Nova dependência instalada | Seção "Stack Técnica" |
| Nova variável de ambiente | Seção "Chaves & Configuração" |
| Sprint concluído | Mover itens de "🚀 Próximos" para "✅ Concluído"; atualizar roadmap |
| QA checklist completo | Tag Git + atualizar status da fase no Roadmap |
| Mudança de arquitetura | Atualizar "Princípios Arquiteturais" + `.claude/rules/architecture.md` |

---

## 15. 📌 STATUS DA SESSÃO ATUAL

> Última atualização: **2026-08-10** · Sessão: Controle de acessos + refatoração de papéis

### ✅ Concluído nesta sessão (2026-08-10)
- **Bug do CIM corrigido**: a policy de UPDATE em `profiles` só tinha `USING`, sem `WITH CHECK`. Como a expressão consultava a própria tabela (com RLS), ficava autorreferente e o UPDATE afetava zero linhas **sem erro** — gravações silenciosamente descartadas. Resolvido com `can_manage_profiles()` `SECURITY DEFINER` + `WITH CHECK`
- **Tela de Gestão de Acessos** (`/commission/management` → aba Acessos, exclusiva de admin): concede/revoga Membro, Administrador e Diretoria sem SQL manual
- `AuthContext` passou a expor `isAdmin` (antes `userRole` nunca assumia `'admin'`)
- `is_commission_member` → **`is_director_member`**, com as 47 policies RLS de 37 tabelas recriadas
- **`profiles.role` removida** — não era lida por código algum e competia com `user_roles.role`
- Admin não pode revogar o próprio papel (UI + policy de DELETE) — ocorreu em produção e exigiu correção manual
- Projeto Supabase restaurado após pausa (era a causa do "Failed to fetch" no login)
- 4 migrations aplicadas em produção; commits `9783362`, `4e424e8`, `d87d511`, `c861b43` na `main`

### ⚠️ Pendente imediato
- **Deploy no servidor** — o schema de produção já mudou, mas o container roda código antigo. Rodar no servidor: `git pull origin main && docker compose build --no-cache && docker compose up -d`. Antes, conferir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env` do servidor (o Dockerfile faz `COPY .env`)
- **`.env` está versionado no git** — viola a regra do projeto; tratar com `git rm --cached .env`
- Policy redundante `"Admins can manage all roles"` ainda no banco
- Criar 2º administrador — hoje só existe um
- Criação de contas sem confirmação por e-mail (membros que não acessam e-mail) — decisões em aberto

### 🎯 Bloqueantes restantes (Sprint 1)
| ID | Arquivo | Problema |
|----|---------|---------|
| G-4 | `src/pages/CommissionVisitors.tsx` linhas 295–408 | Campos de telefone duplicados |
| A-1 | `src/pages/CommissionSecretary.tsx` | 6x `supabase.from()` direto na View |
| A-2 | `src/components/chancellery/ChancelleryAttendanceReport.tsx` | 4 selects diretos na View |
| A-3 | `src/pages/UserWorks.tsx` | Mutations diretas sem hook |
| B-1 | `src/hooks/useFinancialData.ts` | 14x `as any` |
| B-2 | `src/hooks/useSecretary.ts` | 6x `as any` |
| B-3 | `src/hooks/useHospitalaria.ts` + `useAuditLog.ts` | 6x `as any` |

### 📋 Próximo passo exato (início da próxima sessão)
1. **Deploy no servidor** — pendência mais urgente: produção roda código antigo contra schema novo
2. **G-4** — corrigir campos de telefone duplicados em `CommissionVisitors.tsx` linhas 295–408 (~1h)
3. **A-1** — ler `CommissionSecretary.tsx` e extrair 6 chamadas `supabase.from()` para `useSecretary.ts`

### 💾 Memória persistida
- `.claude/memory/sessao_atual.md` — resumo completo desta sessão
- `.claude/memory/MEMORY.md` — índice + infraestrutura configurada
- `C:\Users\rlcun\.claude\projects\...\memory\project_brevo.md` — detalhes da integração Brevo
