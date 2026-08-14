# Backlog de Melhorias — Loja Amor da Pátria
**Planejamento em Épicos e User Stories**
Versão: 1.0 · Data: 2026-04-15

> Classificação: 🔴 Necessária (débito técnico / segurança) · 🟡 Importante (qualidade / UX) · 🟢 Desejável (evolução de produto)

| Épico | Tema | Prioridade | Stories |
|-------|------|-----------|---------|
| A | Refatoração MVC | 🔴 | 5 |
| B | Eliminar `any` (TypeScript) | 🔴 | 5 |
| C | Testes (zero → básico) | 🔴 | 8 |
| D | Performance / Code Splitting | 🟡 | 7 |
| E | Error Boundaries / Resiliência | 🟡 | 5 |
| F | UX Mobile e Acessibilidade | 🟡 | 7 |
| G | Funcionalidades Faltando | 🟡 | 10 |
| H | Hardening de Segurança | 🔴 | 6 |
| I | CI/CD e Observabilidade | 🟢 | 6 |
| J | Evoluções de Produto | 🟢 | 10 |
| K | Tesouraria: Conciliação Bancária | 🟡 | 10 |

---

## Épico A — Arquitetura: Refatoração MVC 🔴
**Objetivo:** Eliminar chamadas diretas ao Supabase em componentes View, centralizando todo acesso a dados na camada de Service/Controller (hook).

**Contexto:** A auditoria identificou violações da arquitetura MVC documentada em `.claude/rules/architecture.md` em pelo menos 3 arquivos críticos: `CommissionSecretary.tsx`, `ChancelleryAttendanceReport.tsx` e `UserWorks.tsx`.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| A-1 | Dev | Extrair as 6 chamadas supabase de `CommissionSecretary.tsx` para `useSecretary.ts` | Componente não ter conhecimento de Supabase | Componente usa apenas funções do hook; sem `supabase.from()` na View |
| A-2 | Dev | Criar `useChancellery.ts` com os 4 selects de `ChancelleryAttendanceReport.tsx` | Separar acesso a dados da renderização | Hook expõe dados tipados; componente recebe apenas props/retorno do hook |
| A-3 | Dev | Mover mutations de `UserWorks.tsx` para `useUserWorks.ts` | Componente ser puramente visual | Todas as mutações passam pelo hook; sem `useState`/`useEffect` de negócio na View |
| A-4 | Dev | Criar camada `services/` para funções async puras de acesso ao Supabase | Separar regra de negócio de orquestração React | Cada feature tem `{feature}.service.ts` com funções sem React |
| A-5 | Dev | Auditar todos os 38 arquivos em `src/pages/` para verificar violações restantes | Garantir conformidade total da arquitetura | Relatório de conformidade; zero chamadas diretas a Supabase em View |

---

## Épico B — Qualidade de Tipo: Eliminar `any` 🔴
**Objetivo:** Substituir os 27+ usos de `as any` e `any` por tipos explícitos derivados das definições do Supabase.

**Contexto:** `useFinancialData.ts` (14 instâncias), `useSecretary.ts` (6), `useHospitalaria.ts` (4), `useAuditLog.ts` (2). Mascaram erros de runtime e tornam refatoração perigosa.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| B-1 | Dev | Tipar corretamente as queries de `useFinancialData.ts` usando os tipos do Supabase | Eliminar 14 casts `as any` | Zero `any` no arquivo; `pnpm tsc --noEmit` sem erros |
| B-2 | Dev | Criar interfaces para os retornos de `useSecretary.ts` | Substituir 6 `as any` por tipos explícitos | Tipos derivados de `Database['public']['Tables']` do Supabase |
| B-3 | Dev | Tipar `useHospitalaria.ts` e `useAuditLog.ts` | Eliminar 6 casts restantes | Sem `as any` em nenhum hook |
| B-4 | Dev | Habilitar `strict: true` sem supressões no `tsconfig.json` | TypeScript proteger contra regressões futuras | CI falha em qualquer novo `any` não justificado |
| B-5 | Dev | Documentar padrão de tipos para queries Supabase com joins | Evitar recorrência do problema | Exemplo no `src/CLAUDE.md` com tipo inferido de join |

---

## Épico C — Testes: Cobertura do Zero ao Básico 🔴
**Objetivo:** Implementar testes unitários para os hooks críticos e testes E2E para os fluxos principais, saindo de 0% de cobertura.

**Contexto:** O projeto tem Vitest configurado e `e2e/CLAUDE.md` documentado, mas zero arquivos de teste existem.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| C-1 | Dev | Testes unitários para `useFinancialData.ts` | Garantir cálculos de saldo e inadimplência corretos | Cobertura dos caminhos: receita, despesa, inadimplência; mock do Supabase |
| C-2 | Dev | Testes unitários para `useSecretary.ts` | Garantir operações de documento sem regressão | CRUD de documentos, convocações e certificados testados |
| C-3 | Dev | Testes unitários para `useAttendances.ts` | Garantir lógica de frequência correta | Cenários: presente, ausente, justificado; percentual calculado |
| C-4 | Dev | Teste E2E do fluxo de login (happy path) | Detectar quebras de autenticação automaticamente | Login com credencial válida → dashboard; credencial inválida → erro exibido |
| C-5 | Dev | Teste E2E do fluxo de cadastro e aprovação | Garantir que novo membro não acessa sem aprovação | Cadastro → pending → admin aprova → acesso liberado |
| C-6 | Dev | Teste E2E de upload de documento na secretaria | Garantir que feature crítica não regride | Upload PDF → documento listado; tamanho inválido → erro amigável |
| C-7 | Dev | Configurar coverage report no CI (`pnpm test --coverage`) | Tornar cobertura visível no pipeline | Relatório HTML gerado; threshold mínimo de 40% para hooks |
| C-8 | Dev | Configurar `playwright.config.ts` com base no `e2e/CLAUDE.md` | Executar E2E no CI (GitHub Actions) | Testes E2E rodam em `pnpm test:e2e`; screenshots de falha salvas |

---

## Épico D — Performance: Code Splitting e Otimização de Queries 🟡
**Objetivo:** Reduzir o bundle inicial com lazy loading de rotas e eliminar queries `select('*')` desnecessárias.

**Contexto:** 100% das rotas são carregadas eagerly. 8+ hooks usam `select('*')`. Sem paginação em listas.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| D-1 | Dev | Converter todas as rotas de `/commission/*` para `React.lazy()` + `Suspense` | Reduzir bundle inicial em ~60% | Lighthouse FCP melhora; cada route chunk separado no build |
| D-2 | Dev | Adicionar `<Suspense fallback={<PageSkeleton />}>` em todas as rotas lazy | UX sem flash branco durante carregamento | Skeleton visível em slow 3G simulado |
| D-3 | Dev | Substituir `select('*')` por colunas explícitas em todos os hooks | Reduzir payload das queries Supabase | Zero `select('*')` em produção; payloads menores confirmados no Network tab |
| D-4 | Dev | Implementar paginação em `CommissionProfiles.tsx` (lista de membros) | Evitar timeout em lodges com 100+ membros | Paginação de 20 itens; botão "Carregar mais" ou paginação numérica |
| D-5 | Dev | Implementar paginação em `FinanceTransactions.tsx` | Evitar lentidão com histórico extenso | Filtro por período + paginação; range-based query no Supabase |
| D-6 | Dev | Implementar virtualização (`react-window` ou similar) em listas longas | Manter 60fps em listas com 50+ itens | FPS estável com 200 itens renderizados; `src/CLAUDE.md` indica threshold |
| D-7 | Dev | Adicionar `useMemo` nos cálculos de dashboard financeiro | Evitar recálculos a cada render | Memoização dos totais de receita/despesa; profiling confirma redução |

---

## Épico E — Resiliência: Error Boundaries e Tratamento de Erros 🟡
**Objetivo:** Isolar falhas por feature, padronizar tratamento de erros nos hooks e tornar o sistema resiliente a falhas parciais.

**Contexto:** Zero `ErrorBoundary` implementado. 48 `console.error` sem feedback ao usuário. Padrões inconsistentes entre hooks.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| E-1 | Dev | Criar componente `<FeatureErrorBoundary>` reutilizável | Isolar falhas de uma comissão sem quebrar o app inteiro | Erro em `/commission/finance` não afeta `/commission/secretary` |
| E-2 | Dev | Envolver cada página de comissão com `<FeatureErrorBoundary>` | Mostrar fallback amigável em vez de tela branca | Mensagem "Esta seção encontrou um problema" + botão "Tentar novamente" |
| E-3 | Dev | Padronizar tratamento de erros em todos os 17 hooks | Eliminar os 48 `console.error` silenciosos | Hook padrão: toast com título + descrição do erro; error propagado via React Query |
| E-4 | Dev | Criar utilitário `handleSupabaseError(error)` centralizado | Traduzir códigos de erro do Postgres para mensagens amigáveis | Erro de FK → "Registro vinculado a outros dados"; duplicata → "Já existe um registro com este dado" |
| E-5 | Membro | Ver mensagem útil quando minha ação falha | Saber o que fazer a seguir | Toast com ação sugerida (ex: "Tente novamente" ou "Contate o administrador") |

---

## Épico F — UX: Experiência Mobile e Acessibilidade 🟡
**Objetivo:** Garantir que membros possam usar o sistema confortavelmente em dispositivos móveis e com tecnologias assistivas.

**Contexto:** Navegação mobile usa apenas breakpoints CSS; `use-mobile.tsx` existe mas não é utilizado. Sem testes de acessibilidade.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| F-1 | Membro mobile | Ver a navegação adaptada ao meu dispositivo | Acessar funcionalidades sem precisar de desktop | Menu mobile cobre 100% das rotas que o desktop cobre |
| F-2 | Dev | Integrar `use-mobile.tsx` na navegação | Lógica condicional em React, não só em CSS | Componente detecta mobile via hook; comportamento de touch otimizado |
| F-3 | Membro mobile | Registrar minha presença em uma sessão pelo celular | Participar das chamadas sem precisar de computador | Fluxo de attendance completo funciona em viewport 375px |
| F-4 | Dev | Adicionar skip-to-content link e aria-labels em formulários | Conformidade básica com WCAG 2.1 AA | Leitor de tela navega corretamente pelos formulários principais |
| F-5 | Dev | Implementar testes de acessibilidade com `vitest-axe` | Detectar regressões de acessibilidade automaticamente | Sem violations críticas nos componentes de formulário |
| F-6 | Membro | Ver indicador de carregamento consistente em todas as ações | Saber que minha ação foi recebida | Skeleton/spinner padronizado em todos os formulários de submit |
| F-7 | Membro | Confirmar antes de ações destrutivas (deletar, rejeitar) | Evitar exclusões acidentais | Dialog de confirmação com descrição do impacto antes de DELETE |

---

## Épico G — Funcionalidades: Lacunas Identificadas 🟡
**Objetivo:** Completar features que estão parcialmente implementadas ou ausentes conforme o PRD.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| G-1 | Admin | Editar registros em `CommissionCRUD.tsx` (não só criar) | CRUD completo sem precisar ir à outra tela | Todos os 11 tabs têm ações de editar e excluir |
| G-2 | Admin | Exportar lista de membros para Excel/CSV | Gerar relatórios fora do sistema | Botão "Exportar" em `CommissionProfiles.tsx` gera `.xlsx` com dados atuais |
| G-3 | Admin | Importar lista de membros via CSV | Migração inicial ou atualização em massa | Upload de CSV valida formato, preview dos dados, importação com rollback em erro |
| G-4 | Secretário | Corrigir campos duplicados no formulário de visitantes | Preencher formulário sem confusão | `CommissionVisitors.tsx` sem campos de telefone duplicados (linhas 295-408) |
| G-5 | Tesoureiro | Filtrar transações por período, tipo e categoria | Analisar dados financeiros com precisão | Filtros combinados funcionam; URL reflete filtros ativos |
| G-6 | Membro | Receber notificação quando uma mensagem me é enviada | Não perder comunicados importantes | Badge de não lidos atualiza em tempo real (Supabase Realtime) |
| G-7 | Admin | Ver dashboard com KPIs em tempo real na homepage | Visão executiva ao entrar no sistema | KPIs: membros ativos, frequência do mês, saldo, próxima sessão |
| G-8 | Secretário | Gerar PDF de convocação automaticamente | Distribuir documento oficial sem formatação manual | Botão "Gerar PDF" em `SecretaryConvocations.tsx` produz PDF estilizado |
| G-9 | Membro | Ver meu histórico de frequência com gráfico | Acompanhar minha regularidade | Página `/members/agenda` exibe gráfico de barras dos últimos 12 meses |
| G-10 | Admin | Registrar datas de posse e demissão de cargos | Histórico de oficiais completo | `CommissionMasters.tsx` permite cadastrar período de cada venerabilíssimo com data início/fim |

---

## Épico K — Tesouraria: Conciliação de Extrato Bancário 🟡
**Objetivo:** Permitir que o tesoureiro importe extratos bancários (OFX/CSV) e concilie automaticamente as entradas/saídas com as transações já lançadas no sistema, identificando divergências antes do fechamento mensal.

**Contexto:** Atualmente o sistema registra transações manualmente em `financial_transactions`. Não há validação cruzada com o extrato real do banco, gerando risco de erro humano e dificultando o fechamento mensal. A conciliação resolve isso ao comparar o que está no sistema com o que o banco registrou.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| K-1 | Tesoureiro | Importar extrato bancário nos formatos OFX e CSV | Não precisar digitar cada lançamento do banco | Upload aceita `.ofx` e `.csv`; parser extrai: data, valor, descrição, tipo (crédito/débito) |
| K-2 | Tesoureiro | Ver os lançamentos do extrato lado a lado com os lançamentos do sistema | Identificar o que está conciliado e o que diverge | Tela dividida: coluna "Extrato Banco" × coluna "Sistema"; status por linha: Conciliado / Pendente / Divergente |
| K-3 | Tesoureiro | Conciliar automaticamente lançamentos por valor e data (±1 dia) | Reduzir trabalho manual na maioria dos casos | Match automático se valor e data baterem; itens ambíguos vão para fila de revisão manual |
| K-4 | Tesoureiro | Conciliar manualmente um lançamento do extrato com uma transação do sistema | Resolver casos que o automático não conseguiu | Drag-and-drop ou seleção de par; confirmação registra o vínculo na tabela `bank_reconciliations` |
| K-5 | Tesoureiro | Criar um lançamento no sistema diretamente a partir de um item do extrato não encontrado | Não perder movimentações que esqueci de lançar | Botão "Criar transação" no item do extrato preenche formulário com dados importados |
| K-6 | Tesoureiro | Marcar um lançamento do extrato como "ignorar" (taxa bancária, IOF, etc.) | Não poluir a conciliação com itens irrelevantes | Item ignorado sai da lista de pendentes; motivo registrado com quem ignorou |
| K-7 | Tesoureiro | Ver o sumário da conciliação: total conciliado, total pendente, diferença | Fechar o mês com segurança | Card de sumário: saldo banco, saldo sistema, diferença; diferença zero = mês fechado |
| K-8 | Tesoureiro | Salvar e reabrir uma conciliação em andamento | Não perder progresso ao sair da página | Conciliação tem status: `em_andamento`, `fechada`; rascunho salvo automaticamente |
| K-9 | Tesoureiro | Fechar a conciliação do mês e gerar relatório PDF | Documentar o fechamento para auditoria | Status muda para `fechada`; PDF gerado com: data, responsável, totais, lista de itens pendentes |
| K-10 | Admin | Ver histórico de todas as conciliações realizadas | Auditar fechamentos anteriores | Listagem por mês/ano com status, responsável e link para o PDF gerado |

### Modelo de dados
```typescript
interface BankStatement {
  id: string;
  account_id: string;           // FK financial_accounts
  reference_month: string;      // '2026-04'
  file_url: string;             // OFX/CSV no Storage
  imported_by: string;          // user_id
  imported_at: string;
  status: 'em_andamento' | 'fechada';
}

interface BankStatementEntry {
  id: string;
  statement_id: string;
  date: string;
  amount: number;               // positivo = crédito, negativo = débito
  description: string;
  bank_reference?: string;      // ID único do banco (campo FITID no OFX)
  status: 'pendente' | 'conciliado' | 'ignorado';
  ignored_reason?: string;
}

interface BankReconciliation {
  id: string;
  statement_entry_id: string;   // FK bank_statement_entries
  transaction_id: string;       // FK financial_transactions
  reconciled_by: string;        // user_id
  reconciled_at: string;
  match_type: 'automatico' | 'manual';
}
```

### Novas tabelas Supabase
- `bank_statements` — cabeçalho da importação por mês/conta
- `bank_statement_entries` — lançamentos individuais do extrato
- `bank_reconciliations` — vínculos entre extrato e sistema

### Componentes e arquivos (novos)
- `src/components/finance/FinanceReconciliation.tsx` — tela principal (tab na `CommissionFinance`)
- `src/components/finance/ReconciliationImport.tsx` — upload e parse de OFX/CSV
- `src/components/finance/ReconciliationTable.tsx` — tabela lado a lado com match visual
- `src/components/finance/ReconciliationSummary.tsx` — card de sumário e botão fechar
- `src/hooks/useReconciliation.ts` — controller: import, match, save, close
- `src/features/finance/services/reconciliation.service.ts` — parser OFX/CSV, lógica de match automático

### Dependências técnicas
- Parser OFX: biblioteca `ofx-js` ou implementação própria (OFX é XML-like)
- Parser CSV: `papaparse` (já pode estar disponível via dependências transitivas)
- Geração de PDF: `jsPDF` ou Edge Function com template HTML → PDF
- RLS: `bank_statements` e `bank_reconciliations` acessíveis apenas para `admin`

---

## Épico H — Segurança: Hardening 🔴
**Objetivo:** Garantir que as políticas de segurança documentadas em `.claude/rules/security.md` estejam 100% implementadas.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| H-1 | Dev | Verificar que o `SUPABASE_PUBLISHABLE_KEY` usa variável de ambiente | Nunca ter chave hardcoded no bundle | `client.ts` usa apenas `import.meta.env.VITE_*`; `.env` no `.gitignore` |
| H-2 | Dev | Auditar todas as políticas RLS das tabelas sensíveis | Garantir que dados financeiros e sociais não vazem | RLS habilitado + policy definida em `financial_*` e `hospitalar_*`; script de verificação |
| H-3 | Dev | Adicionar validação server-side nas Edge Functions para operações críticas | Client não ser único ponto de segurança | Aprovação de membros e movimentações financeiras validadas no backend |
| H-4 | Dev | Implementar rate limiting na rota de login | Prevenir brute force | Supabase Auth config: máximo 5 tentativas por minuto por IP |
| H-5 | Dev | Adicionar auditoria automática em toda ação crítica | Rastreabilidade completa | INSERT em `audit_logs` em: aprovação de membro, transação financeira, exclusão de documento |
| H-6 | Dev | Criar script de checagem pré-PR (`security-check.sh`) | Automatizar auditoria de segurança | Script detecta: `select('*')`, `service_role` em src/, secrets no diff |

---

## Épico I — DevOps: CI/CD e Observabilidade 🟢
**Objetivo:** Automatizar qualidade, build e deploy com pipeline CI/CD e adicionar observabilidade básica.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| I-1 | Dev | Pipeline GitHub Actions com type check + lint + testes | PR não mergeado com código quebrado | CI falha em: erro TypeScript, lint warning, teste falhando |
| I-2 | Dev | Build automatizado com Docker para produção | Deploy reproduzível e versionado | `Dockerfile` funcional; `docker build && docker run` sobe o app na porta 3000 |
| I-3 | Dev | Tags de release semânticas automatizadas | Rollback fácil por versão | `git tag v1.0.0` dispara build de produção + artifact no GitHub Releases |
| I-4 | Dev | Logs de erro centralizados (Sentry ou similar) | Detectar erros em produção sem esperar relato de usuário | Sentry SDK configurado; erros não tratados capturados com contexto do usuário |
| I-5 | Dev | Health check endpoint no servidor de produção | Monitorar uptime e reiniciar automaticamente | PM2 `ecosystem.config.js` com health check; alerta em downtime |
| I-6 | Dev | Variáveis de ambiente por ambiente (dev/staging/prod) | Evitar acidente de produção em desenvolvimento | `.env.local`, `.env.staging`, `.env.production` com chaves Supabase separadas |

---

## Épico J — Produto: Evoluções Desejáveis 🟢
**Objetivo:** Funcionalidades que elevam o valor do produto e a experiência dos membros.

### User Stories

| ID | Como | Quero | Para | Critérios de aceite |
|----|------|-------|------|---------------------|
| J-1 | Membro | Receber e-mail de convocação automaticamente | Não perder sessões por falta de aviso | n8n workflow dispara e-mail via Brevo ao criar convocação |
| J-2 | Admin | Enviar lembretes de inadimplência por e-mail | Reduzir inadimplência sem contato manual | n8n verifica inadimplentes semanalmente e dispara e-mail via Brevo |
| J-3 | Membro | Acessar o sistema como Progressive Web App (PWA) | Instalar no celular sem app store | `manifest.json` e service worker configurados; ícone e splash screen |
| J-4 | Membro | Ver galeria de fotos de eventos | Guardar memórias das atividades da loja | Upload e exibição de imagens em `events` e `activities` (já tem tabelas) |
| J-5 | Admin | Configurar campos personalizados no perfil de membros | Adequar às necessidades específicas da loja | Interface de configuração de campos extras no perfil |
| J-6 | Admin | Gerar relatório anual em PDF | Apresentar resultados na sessão magna | Relatório consolida: frequência, financeiro, atividades e hospitalária do ano |
| J-7 | Membro | Pesquisar no glossário e artigos com busca full-text | Encontrar informações rapidamente | Barra de busca com debounce; Supabase full-text search no conteúdo |
| J-8 | Admin | Dashboard com mapa de calor de frequência | Identificar membros em risco de perda de quórum | Heatmap mensal de presença por membro nos últimos 6 meses |
| J-9 | Membro | Chat com IA para dúvidas maçônicas | Aprendizado autônomo 24/7 | Chat integrado com Claude API; histórico em `n8n_chat_histories` |
| J-10 | Admin | Integração com PIX para recebimento de mensalidades | Facilitar pagamento dos membros | QR Code PIX gerado por membro; confirmação automática via webhook |

---

## Priorização Resumida

### Sprint 1 — Débito Crítico (2 semanas)
| ID | Título | Esforço |
|----|--------|---------|
| A-1..A-3 | Refatorar violações MVC nos 3 arquivos críticos | M |
| B-1..B-3 | Eliminar `any` nos hooks principais | M |
| G-4 | Corrigir duplicidade no formulário de visitantes | P |
| H-1 | Verificar/corrigir variáveis de ambiente | P |

### Sprint 2 — Qualidade (2 semanas)
| ID | Título | Esforço |
|----|--------|---------|
| C-1..C-3 | Testes unitários dos hooks críticos | G |
| C-4..C-5 | Testes E2E dos fluxos de autenticação | G |
| E-1..E-3 | Error Boundaries + padronização de erros | M |
| D-1..D-2 | Code splitting com React.lazy nas rotas | M |

### Sprint 3 — Performance e Segurança (2 semanas)
| ID | Título | Esforço |
|----|--------|---------|
| D-3..D-5 | Otimização de queries e paginação | M |
| H-2..H-5 | Hardening de segurança e RLS | G |
| I-1 | Pipeline CI/CD básico | M |
| F-7 | Confirmação em ações destrutivas | P |

### Sprint 4 — Produto e UX (2 semanas)
| ID | Título | Esforço |
|----|--------|---------|
| G-1..G-2 | CRUD completo + exportação | M |
| G-5..G-7 | Filtros, notificações e dashboard KPI | G |
| F-1..F-3 | Mobile UX melhorado | M |
| J-1..J-2 | Automações e-mail via n8n + Brevo | G |

### Sprint 5 — Conciliação Bancária (2 semanas)
| ID | Título | Esforço |
|----|--------|---------|
| K-1 | Importar extrato OFX/CSV | M |
| K-2..K-3 | Tela de conciliação + match automático | G |
| K-4..K-6 | Match manual, criação de lançamento, ignorar item | G |
| K-7..K-8 | Sumário de fechamento + rascunho persistido | M |

### Sprint 6 — Conciliação: Fechamento e Histórico (1 semana)
| ID | Título | Esforço |
|----|--------|---------|
| K-9 | Fechar conciliação e gerar PDF | M |
| K-10 | Histórico de conciliações com filtro por mês/ano | P |

### Backlog Futuro
- J-3 (PWA), J-6 (relatório anual PDF), J-7 (busca full-text), J-8 (heatmap), J-9 (chat IA), J-10 (PIX)

---

## Legenda de Esforço
| Símbolo | Estimativa |
|---------|-----------|
| P | Pequeno — até 4h |
| M | Médio — 1 a 3 dias |
| G | Grande — 3 a 5 dias |
| GG | Muito Grande — 1+ semanas |

---

*Backlog gerado com base em auditoria do codebase — 2026-04-15*
*Atualizar após cada sprint com status de conclusão.*
