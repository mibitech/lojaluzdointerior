# PRD — Loja Amor da Pátria
**Product Requirements Document**
Versão: 1.0 · Data: 2026-04-15 · Autor: Ricardo Lopes

---

## 1. Visão Geral

**Loja Amor da Pátria** é uma aplicação web de gestão para uma Loja Maçônica. O sistema centraliza as operações administrativas, financeiras, secretariais e de engajamento dos membros em uma plataforma única, segura e com acesso baseado em papéis (roles).

### Problema que resolve
As operações de uma loja maçônica dependem de processos administrativos complexos — controle de frequência, atas, tesouraria, correspondências e gestão de membros — tipicamente feitos com planilhas, e-mails e papel. Este sistema digitaliza e centraliza tudo, garantindo rastreabilidade e acesso controlado.

### Público-alvo
| Papel | Responsabilidades |
|-------|------------------|
| **admin** | Aprovação de membros, acesso total ao sistema |
| **secretary** | Documentos, convocações, atas, certificados, correspondências |
| **member** | Acesso à agenda, documentos próprios, mensagens, perfil |
| *Tesoureiro (derivado)* | Gestão financeira, relatórios de inadimplência |
| *Chanceler (derivado)* | Documentação oficial dos membros |
| *Hospitaleiro (derivado)* | Casos sociais, visitas, fundo de beneficência |

### Objetivos de negócio
1. Eliminar processos manuais nas comissões da loja
2. Garantir controle de acesso por papel com auditoria
3. Oferecer visibilidade em tempo real da saúde financeira, frequência e atividades da loja
4. Preservar o histórico digital da loja (atas, documentos, venerabilíssimos)

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite (SWC) |
| Estilo | Tailwind CSS + shadcn/ui (Radix UI) |
| Roteamento | React Router DOM v6 |
| Estado servidor | TanStack Query v5 (React Query) |
| Formulários | React Hook Form + Zod |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Gráficos | Recharts |
| Notificações | Sonner + shadcn Toast |
| Deploy | PM2 / Docker (nunca Vercel) |
| Package manager | pnpm |

---

## 3. Arquitetura de Rotas

### Rotas Públicas (sem autenticação)
| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Index | Homepage / Dashboard público |
| `/auth` | Auth | Login e cadastro |
| `/about` | About | Sobre a loja |
| `/activities` | Activities | Atividades da loja |
| `/events` | Events | Calendário de eventos |
| `/education` | Education | Conteúdo educacional |
| `/contact` | Contact | Formulário de contato |
| `/members` | Members | Diretório de membros |
| `/members/worshipful-masters` | WorshipfulMasters | Galeria de venerabilíssimos |

### Rotas Privadas (autenticação obrigatória)
| Rota | Página | Papel mínimo |
|------|--------|-------------|
| `/profile` | Profile | member |
| `/pending-approval` | PendingApproval | Qualquer (status pendente) |
| `/members/documents` | MemberDocuments | member |
| `/members/agenda` | MemberAgenda | member |
| `/members/study-time` | UserWorks | member |
| `/members/messages` | MemberMessages | member |
| `/commission/secretary` | CommissionSecretary | secretary / admin |
| `/commission/finance` | CommissionFinance | admin |
| `/commission/management` | CommissionManagement | admin |
| `/commission/chancellery` | CommissionChancellery | secretary / admin |
| `/commission/hospitalaria` | CommissionHospitalaria | admin |
| `/commission/messages` | CommissionMessages | admin / secretary |
| `/commission/sessions` | CommissionSessions | admin / secretary |
| `/commission/attendances` | CommissionAttendances | admin / secretary |
| `/commission/study-time` | CommissionStudyTime | admin |
| `/commission/books` | CommissionBooks | admin |
| `/commission/articles` | CommissionArticles | admin |
| `/commission/glossary` | CommissionGlossary | admin |
| `/commission/faq` | CommissionFAQ | admin |
| `/commission/events` | CommissionEvents | admin |
| `/commission/activities` | CommissionActivities | admin |
| `/commission/masters` | CommissionMasters | admin |
| `/commission/visitors` | CommissionVisitors | admin / secretary |
| `/commission/profiles` | CommissionProfiles | admin |
| `/commission/crud` | CommissionCRUD | admin |
| `/commission/lodge-info` | CommissionLodgeInfo | admin |
| `/commission/copo-dagua` | CommissionCopoDagua | admin / secretary |

---

## 4. Épicos e Funcionalidades

---

### Épico 1 — Autenticação e Gestão de Perfil
**Objetivo:** Acesso seguro ao sistema com fluxo de aprovação para novos membros.

#### Critérios de aceite
- [x] Login com e-mail e senha via Supabase Auth
- [x] Cadastro de novo membro cria perfil com status `pending`
- [x] Admin aprova/rejeita cadastros pendentes
- [x] Membro aprovado acessa todas as rotas privadas de seu papel
- [x] Usuário pode visualizar e editar perfil (nome, avatar, dados pessoais)
- [x] Logout redireciona para a homepage

#### Histórias de usuário
1. Como **membro**, quero fazer login para acessar áreas restritas.
2. Como **novo membro**, quero me cadastrar para solicitar acesso ao sistema.
3. Como **administrador**, quero aprovar ou rejeitar cadastros para controlar o acesso.
4. Como **membro logado**, quero atualizar meus dados pessoais e foto.

#### Regras de negócio
- Rotas privadas requerem sessão válida; sessão expirada redireciona para `/auth`
- Status `pending` → acesso apenas à tela `/pending-approval`
- Status `rejected` → bloqueio total; mensagem explicativa
- Apenas `admin` pode alterar o status de um perfil
- Roles armazenadas na tabela `user_roles`, não em `profiles`

#### Modelo de dados
```typescript
interface UserProfile {
  id: string;            // UUID (auth.users)
  email: string;
  full_name: string;
  status: 'pending' | 'approved' | 'rejected';
  avatar_url?: string;
  phone?: string;
  degree?: number;       // Grau maçônico
  cim?: string;          // Cadastro Individual do Maçom
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;       // FK auth.users
  role: 'admin' | 'member' | 'secretary';
}
```

#### Componentes e arquivos
- `src/pages/Auth.tsx` — tela de login/cadastro
- `src/pages/Profile.tsx` — perfil do usuário
- `src/pages/PendingApproval.tsx` — tela de bloqueio
- `src/contexts/AuthContext.tsx` — estado global da sessão
- `src/hooks/useProfiles.ts` — dados de perfil

#### APIs Supabase
- `supabase.auth.signInWithPassword()`
- `supabase.auth.signUp()`
- `supabase.auth.signOut()`
- `supabase.from('profiles').select/update`
- `supabase.from('user_roles').select`

---

### Épico 2 — Gestão Administrativa e Secretaria
**Objetivo:** Digitalizar as operações da secretaria — documentos, atas, convocações, certificados e correspondências.

#### Critérios de aceite
- [x] Dashboard de secretaria com visão geral das atividades
- [x] Upload, visualização e exclusão de documentos PDF
- [x] Registro e listagem de convocações para sessões
- [x] Emissão e controle de certificados para membros
- [x] Registro de correspondências recebidas e enviadas
- [x] Acesso de escrita restrito a `admin` e `secretary`

#### Histórias de usuário
1. Como **secretário**, quero fazer upload de atas para arquivá-las digitalmente.
2. Como **secretário**, quero registrar convocações para avisar os membros das sessões.
3. Como **secretário**, quero emitir certificados para registrar a evolução dos membros.
4. Como **secretário**, quero registrar correspondências para manter o histórico da loja.
5. Como **membro**, quero acessar meus documentos disponibilizados pela secretaria.

#### Regras de negócio
- Escrita em documentos: apenas `admin` e `secretary`
- Leitura de documentos próprios: qualquer `member` aprovado
- Documentos têm tipos: `ata`, `edital`, `oficio`, `outro`
- Arquivos armazenados no Supabase Storage (`documents/{user_id}/{filename}`)
- Certificados vinculados ao membro e ao tipo de progressão

#### Modelo de dados
```typescript
interface SecretaryDocument {
  id: string;
  title: string;
  type: 'ata' | 'edital' | 'oficio' | 'outro';
  file_url: string;
  uploaded_by: string;   // user_id
  created_at: string;
}

interface Convocation {
  id: string;
  session_id?: string;
  title: string;
  content: string;
  date: string;
  sent_at?: string;
  created_by: string;
}

interface Certificate {
  id: string;
  member_id: string;
  type: string;
  issued_at: string;
  issued_by: string;
  file_url?: string;
}

interface Correspondence {
  id: string;
  direction: 'received' | 'sent';
  subject: string;
  sender_or_recipient: string;
  date: string;
  content?: string;
  file_url?: string;
}
```

#### Componentes e arquivos
- `src/pages/CommissionSecretary.tsx`
- `src/components/secretary/SecretaryDashboard.tsx`
- `src/components/secretary/SecretaryDocuments.tsx`
- `src/components/secretary/SecretaryConvocations.tsx`
- `src/components/secretary/SecretaryCertificates.tsx`
- `src/components/secretary/SecretaryCorrespondence.tsx`
- `src/hooks/useSecretary.ts`
- `src/pages/MemberDocuments.tsx` — acesso do membro

#### Tabelas Supabase
- `secretary_documents`
- `secretary_convocations`
- `secretary_certificates`
- `secretary_correspondence`

---

### Épico 3 — Controle Financeiro e Chancelaria
**Objetivo:** Gerenciar a saúde financeira da loja (receitas, despesas, inadimplência) e a documentação oficial da Chancelaria.

#### Critérios de aceite
- [x] Registro de entradas e saídas com categoria e descrição
- [x] Dashboard financeiro com gráficos mensais/anuais
- [x] Listagem de membros inadimplentes com filtros
- [x] Controle de contas financeiras da loja
- [x] Relatórios exportáveis (XLSX)
- [x] Chancelaria: relatórios de presença, membros e visitantes
- [x] Acesso financeiro restrito a `admin`

#### Histórias de usuário
1. Como **tesoureiro**, quero registrar pagamentos para controlar o fluxo de caixa.
2. Como **tesoureiro**, quero visualizar gráficos financeiros para tomada de decisão.
3. Como **tesoureiro**, quero identificar inadimplentes para cobranças.
4. Como **chanceler**, quero gerar relatórios de presença dos membros.
5. Como **chanceler**, quero controlar o registro de visitantes.

#### Regras de negócio
- Dados financeiros visíveis apenas para `admin`
- Transações têm tipo: `income` (receita) ou `expense` (despesa)
- Cada transação pode ter um comprovante em anexo (Supabase Storage)
- Relatórios de chancelaria acessíveis por `admin` e `secretary`

#### Modelo de dados
```typescript
interface FinancialTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  receipt_url?: string;
  account_id: string;
  created_by: string;
}

interface FinancialAccount {
  id: string;
  name: string;
  balance: number;
  type: string;
}
```

#### Componentes e arquivos
- `src/pages/CommissionFinance.tsx`
- `src/components/finance/FinanceDashboard.tsx`
- `src/components/finance/FinanceTransactions.tsx`
- `src/components/finance/FinanceAccounts.tsx`
- `src/components/finance/FinanceDelinquency.tsx`
- `src/components/finance/FinanceReports.tsx`
- `src/pages/CommissionChancellery.tsx`
- `src/components/chancellery/ChancelleryDashboard.tsx`
- `src/components/chancellery/ChancelleryAttendanceReport.tsx`
- `src/components/chancellery/ChancelleryMemberReport.tsx`
- `src/components/chancellery/ChancelleryVisitorReport.tsx`
- `src/hooks/useFinancialData.ts`

#### Tabelas Supabase
- `financial_transactions`
- `financial_accounts`
- `financial_account_movements`
- `visitors`

---

### Épico 4 — Sessões, Frequência e Eventos
**Objetivo:** Organizar a agenda da loja — sessões maçônicas, controle de frequência dos membros, eventos e o "Copo D'água" (ágape/confraternização pós-sessão).

#### Critérios de aceite
- [x] Criação e edição de sessões (tipo, grau, tema, data)
- [x] Registro de presença por sessão: presente, ausente, justificado
- [x] Dashboard de frequência com percentuais por membro
- [x] Gestão de eventos da loja com imagens
- [x] Calendário de agenda para membros
- [x] Organização das equipes do Copo D'água por sessão
- [x] Somente oficiais autorizado registram frequência

#### Histórias de usuário
1. Como **secretário**, quero criar sessões para registrar as reuniões da loja.
2. Como **oficial**, quero registrar a frequência dos membros em cada sessão.
3. Como **membro**, quero ver minha frequência histórica para acompanhar minha regularidade.
4. Como **administrador**, quero criar eventos da loja visíveis a todos.
5. Como **secretário**, quero organizar as equipes do Copo D'água de cada sessão.

#### Regras de negócio
- Registro de frequência: apenas `admin`, `secretary` e oficiais designados
- Sessões têm tipos: `ordinaria`, `magna`, `instrucao`
- Graus: 1 (Aprendiz), 2 (Companheiro), 3 (Mestre)
- Frequência abaixo de 60% (sem justificativa) pode implicar penalidades
- Eventos públicos aparecem na página `/events` sem autenticação

#### Modelo de dados
```typescript
interface Session {
  id: string;
  date: string;
  type: 'ordinaria' | 'magna' | 'instrucao';
  degree: 1 | 2 | 3;
  theme?: string;
  location?: string;
  created_by: string;
}

interface Attendance {
  id: string;
  session_id: string;
  user_id: string;
  status: 'presente' | 'ausente' | 'justificado';
  recorded_by: string;
  notes?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  is_public: boolean;
  created_by: string;
}

interface CopoDaguaCalendar {
  id: string;
  session_id: string;
  responsible_members: string[];  // user_ids
  notes?: string;
}
```

#### Componentes e arquivos
- `src/pages/CommissionSessions.tsx`
- `src/pages/CommissionAttendances.tsx`
- `src/pages/CommissionCopoDagua.tsx`
- `src/pages/CommissionEvents.tsx`
- `src/pages/Events.tsx`
- `src/pages/MemberAgenda.tsx`
- `src/hooks/useSessions.ts`
- `src/hooks/useAttendances.ts`
- `src/hooks/useEvents.ts`
- `src/hooks/useCopoDagua.ts`

#### Tabelas Supabase
- `sessions`
- `session_attendances`
- `meeting_minutes`
- `meeting_minutes_files`
- `events`
- `event_images`
- `copo_dagua_calendar`

---

### Épico 5 — Comissão de Hospitalaria (Ação Social)
**Objetivo:** Gerenciar as atividades de assistência social e beneficência da loja — casos acompanhados, visitas, pedidos de auxílio e fundo de beneficência.

#### Critérios de aceite
- [x] Registro e acompanhamento de casos sociais
- [x] Agendamento e registro de visitas hospitalares
- [x] Registro de pedidos de auxílio com status de resolução
- [x] Gestão do fundo de beneficência (entradas e saídas)
- [x] Registro de atividades filantrópicas
- [x] Relatórios da comissão

#### Histórias de usuário
1. Como **hospitaleiro**, quero registrar casos de membros para acompanhar seu estado.
2. Como **hospitaleiro**, quero agendar visitas para demonstrar cuidado da loja.
3. Como **membro**, quero solicitar auxílio da loja em situação de necessidade.
4. Como **administrador**, quero ver o saldo do fundo de beneficência.

#### Regras de negócio
- Casos sociais são dados sensíveis — visíveis apenas para `admin` e `hospitalaria`
- Pedidos de auxílio têm status: `pendente`, `aprovado`, `negado`, `concluido`
- Movimentações do fundo requerem aprovação do administrador

#### Modelo de dados
```typescript
interface HospitalarCase {
  id: string;
  member_id: string;
  description: string;
  status: 'active' | 'resolved' | 'monitoring';
  opened_at: string;
  resolved_at?: string;
}

interface HospitalarVisit {
  id: string;
  case_id?: string;
  member_id: string;
  visit_date: string;
  visitors: string[];
  notes?: string;
}

interface HospitalarAidRequest {
  id: string;
  requester_id: string;
  amount?: number;
  description: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  created_at: string;
}
```

#### Componentes e arquivos
- `src/pages/CommissionHospitalaria.tsx`
- `src/components/hospitalaria/HospitalariaDashboard.tsx`
- `src/components/hospitalaria/HospitalariaCases.tsx`
- `src/components/hospitalaria/HospitalariaVisits.tsx`
- `src/components/hospitalaria/HospitalariaAidRequests.tsx`
- `src/components/hospitalaria/HospitalariaFund.tsx`
- `src/components/hospitalaria/HospitalariaPhilanthropy.tsx`
- `src/components/hospitalaria/HospitalariaReports.tsx`
- `src/hooks/useHospitalaria.ts`

#### Tabelas Supabase
- `hospitalar_cases`
- `hospitalar_visits`
- `hospitalar_aid_requests`
- `hospitalar_philanthropy`
- `hospitalar_beneficence_fund`

---

### Épico 6 — Gestão de Conteúdo Educacional e Biblioteca
**Objetivo:** Disponibilizar conteúdo educacional maçônico — artigos, glossário, FAQ, biblioteca de livros e registro de trabalhos/estudos dos membros.

#### Critérios de aceite
- [x] Biblioteca de artigos com categorização
- [x] Glossário de termos maçônicos gerenciável
- [x] FAQ com perguntas e respostas editáveis
- [x] Catálogo de livros com controle de empréstimo
- [x] Registro de trabalhos e estudos dos membros
- [x] Conteúdo educacional organizado por categoria

#### Histórias de usuário
1. Como **administrador**, quero publicar artigos para enriquecer os membros intelectualmente.
2. Como **membro**, quero consultar o glossário para entender os termos maçônicos.
3. Como **membro**, quero registrar meus estudos para acompanhar minha evolução.
4. Como **administrador**, quero gerenciar o acervo de livros da loja.

#### Componentes e arquivos
- `src/pages/CommissionArticles.tsx`
- `src/pages/CommissionGlossary.tsx`
- `src/pages/CommissionFAQ.tsx`
- `src/pages/CommissionBooks.tsx`
- `src/pages/CommissionStudyTime.tsx`
- `src/pages/Education.tsx`
- `src/pages/Library.tsx`
- `src/pages/MemberStudyTime.tsx`
- `src/pages/UserWorks.tsx`
- `src/hooks/useCommemorationDates.ts`

#### Tabelas Supabase
- `educational_content`
- `articles`
- `glossary_terms`
- `faq_items`
- `books`
- `book_loans`
- `users_works`
- `commemorative_dates`

---

### Épico 7 — Comunicação Interna
**Objetivo:** Canal de mensagens interno entre membros e oficiais, com rastreamento de leitura.

#### Critérios de aceite
- [x] Envio de mensagens com destinatário (geral ou específico)
- [x] Listagem de mensagens recebidas e enviadas
- [x] Indicador de mensagens não lidas na navegação
- [x] Administrador pode enviar mensagens para todos os membros
- [x] Registro de leitura por usuário

#### Histórias de usuário
1. Como **administrador**, quero enviar comunicados para todos os membros.
2. Como **membro**, quero ver mensagens não lidas com destaque.
3. Como **membro**, quero ler mensagens recebidas da administração.

#### Componentes e arquivos
- `src/pages/CommissionMessages.tsx`
- `src/pages/MemberMessages.tsx`
- `src/hooks/useUnreadMessages.ts`

#### Tabelas Supabase
- `messages`
- `message_reads`
- `n8n_chat_histories`

---

### Épico 8 — Gestão e Relatórios Administrativos
**Objetivo:** Painel de gestão executiva com indicadores, auditoria, histórico da loja e gestão de venerabilíssimos.

#### Critérios de aceite
- [x] Dashboard executivo com KPIs da loja
- [x] Log de auditoria de ações críticas no sistema
- [x] Histórico da loja e galeria de venerabilíssimos
- [x] Indicadores por área (frequência, financeiro, hospitalária)
- [x] Relatórios gerenciais exportáveis
- [x] Gestão de informações institucionais da loja

#### Componentes e arquivos
- `src/pages/CommissionManagement.tsx`
- `src/pages/CommissionMasters.tsx`
- `src/pages/CommissionLodgeInfo.tsx`
- `src/pages/WorshipfulMasters.tsx`
- `src/components/management/ManagementExecutiveDashboard.tsx`
- `src/components/management/ManagementAreaIndicators.tsx`
- `src/components/management/ManagementAuditoria.tsx`
- `src/components/management/ManagementHistory.tsx`
- `src/components/management/ManagementReports.tsx`
- `src/components/management/ManagementCargoDelivery.tsx`
- `src/hooks/useAuditLog.ts`
- `src/hooks/useMasters.ts`
- `src/hooks/useActiveMasterPeriod.ts`

#### Tabelas Supabase
- `audit_logs`
- `worshipful_masters`
- `officers`
- `lodge_info`
- `management_cargo_reports`

---

## 5. Segurança e Permissões

### Políticas RLS por tabela
Todas as tabelas no Supabase devem ter RLS habilitado. Regras gerais:

| Nível | Política |
|-------|----------|
| Leitura pública | `events`, `activities`, `educational_content`, `articles`, `glossary_terms`, `faq_items`, `lodge_info` |
| Leitura autenticada | `profiles`, `messages`, `sessions`, `books` |
| Leitura restrita | `financial_*` (apenas admin), `hospitalar_*` (admin + hospitalaria) |
| Escrita | Sempre verificar `auth.uid()` e role via `has_role()` |

### Checklist de segurança (pré-PR)
- [ ] Nenhum secret no diff
- [ ] Toda nova tabela com RLS habilitado e policy definida
- [ ] Inputs validados com Zod antes de persistir
- [ ] `service_role` não importado em `src/`
- [ ] Sem `select('*')` em queries de produção

---

## 6. Padrões de Desenvolvimento

### Arquitetura MVC
```
View → Controller (hook) → Service → Supabase
```
- **Model:** `{feature}.types.ts` + `{feature}.service.ts`
- **Controller:** `use{Feature}.ts` (custom hook)
- **View:** `{Feature}Page.tsx` / `{Feature}Card.tsx`

### Convenções de nomenclatura
- Diretórios: `kebab-case`
- Services: `{feature}.service.ts`
- Controllers: `use{Feature}.ts`
- Views: `{Feature}Page.tsx`, `{Feature}Form.tsx`
- Booleanos: `isLoading`, `hasError`, `canSubmit`
- Evitar `enum`; usar `as const` ou uniões de string

### Commits
Conventional Commits obrigatório:
```
feat(auth): adicionar login com magic link
fix(finance): corrigir cálculo de saldo
refactor(sessions): extrair lógica para hook
```

---

## 7. Banco de Dados — Tabelas

### Diagrama de domínios

```
AUTH & PERFIL
  profiles, user_roles

SECRETARIA
  secretary_documents, secretary_convocations,
  secretary_certificates, secretary_correspondence

FINANCEIRO
  financial_accounts, financial_transactions,
  financial_account_movements

SESSÕES & FREQUÊNCIA
  sessions, session_attendances,
  meeting_minutes, meeting_minutes_files

HOSPITALARIA
  hospitalar_cases, hospitalar_visits,
  hospitalar_aid_requests, hospitalar_philanthropy,
  hospitalar_beneficence_fund

EVENTOS & ATIVIDADES
  events, event_images, activities, activity_images,
  copo_dagua_calendar

CONTEÚDO EDUCACIONAL
  educational_content, articles, glossary_terms,
  faq_items, books, book_loans, users_works,
  commemorative_dates

COMUNICAÇÃO
  messages, message_reads, n8n_chat_histories

GESTÃO
  audit_logs, officers, worshipful_masters,
  lodge_info, management_cargo_reports, visitors
```

---

## 8. Deploy e Operações

### Comandos
```bash
pnpm install          # instalar dependências
pnpm dev              # dev server → http://localhost:3000
pnpm build            # build de produção (gera dist/)
pnpm tsc --noEmit     # checar tipos
pnpm lint             # ESLint
pnpm test --run       # testes
```

### Variáveis de ambiente
```env
VITE_SUPABASE_URL=<url-do-projeto>
VITE_SUPABASE_ANON_KEY=<chave-anon>
```

### Deploy
- Build: `pnpm build` → artefato em `dist/`
- Servidor: PM2 ou Docker (nunca Vercel)
- Rollback: tags semânticas Git (`v1.0.0`, `v2.0.0`)

---

## 9. Histórico de Decisões

| Data | Decisão | Justificativa |
|------|---------|--------------|
| 2026-04-15 | pnpm como package manager | Performance e workspaces |
| 2026-04-15 | Supabase como BaaS | Auth + DB + Storage integrados, RLS nativo |
| 2026-04-15 | TanStack Query para estado servidor | Cache, invalidação e mutações declarativas |
| 2026-04-15 | shadcn/ui como sistema de design | Acessibilidade (Radix) + controle total do código |
| 2026-04-15 | Roles em tabela separada (`user_roles`) | Flexibilidade para múltiplos papéis por usuário |
| 2026-04-15 | Deploy PM2/Docker (não Vercel) | Controle total, sem vendor lock-in, SSR futuro possível |

---

*Fim do PRD — Loja Amor da Pátria v1.0*
