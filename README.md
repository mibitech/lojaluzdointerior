# Documentação do Projeto: Loja Amor da Pátria

Este documento apresenta a especificação técnica e funcional completa para o projeto "Loja Amor da Pátria". Trata-se de uma aplicação Web desenvolvida para a gestão e administração de uma Loja Maçônica, oferecendo funcionalidades para os membros e administradores da loja.

## Visão Geral Técnica

A aplicação é uma Single Page Application (SPA) desenvolvida com as seguintes tecnologias principais:
- **Frontend Framework:** React 18
- **Build Tool:** Vite
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS e shadcn/ui (Radix UI)
- **Roteamento:** React Router DOM
- **Gerenciamento de Estado e Fetching:** TanStack Query (React Query)
- **Backend as a Service (BaaS):** Supabase (Autenticação, Banco de Dados PostgreSQL, Storage)
- **Formulários e Validação:** React Hook Form com Zod

---

## Epic 1: Autenticação e Gestão de Perfil

### Documentação Funcional

**Descrição do Epic e seu objetivo de negócio:**
Permitir que usuários da loja (membros e administradores) acessem o sistema de forma segura. Administrar a entrada de novos membros através de um fluxo de aprovação e permitir que os usuários gerenciem suas informações pessoais e credenciais.

**Critérios de Aceitação e Definição de Pronto:**
- Usuários devem conseguir realizar login utilizando e-mail e senha.
- Novos cadastros devem ficar com status pendente até aprovação de um administrador.
- Usuários devem poder recuperar suas senhas.
- Usuários autenticados devem acessar e editar as informações do seu perfil.
- Implementado, testado, com tratamento de erros na UI e integrado ao Supabase Auth.

**Histórias de Usuário:**
1. *Como membro*, quero fazer login no sistema *para acessar áreas restritas*.
2. *Como novo membro*, quero me cadastrar *para solicitar acesso ao sistema*.
3. *Como administrador*, quero aprovar ou rejeitar novos cadastros *para manter a segurança e restrição de acesso*.
4. *Como membro logado*, quero visualizar e atualizar meus dados *para mantê-los atualizados*.

**Regras de Negócio:**
- O acesso a rotas privadas exige token de autenticação válido.
- Cadastros novos não têm acesso a rotas privadas até que o campo `status` do perfil seja alterado para "aprovado".
- Apenas usuários com `role` de administrador podem aprovar novos cadastros.

**Casos de Uso:**
- **Principal:** Login bem-sucedido e redirecionamento para o Dashboard.
- **Alternativo:** Tentativa de login com credenciais incorretas apresenta mensagem de erro.
- **Principal:** Edição de foto e dados do perfil.

**Dependências:** Nenhuma.

### Documentação Técnica

**Arquitetura e Estrutura de Componentes:**
- Páginas: `src/pages/Auth.tsx`, `src/pages/Profile.tsx`, `src/pages/PendingApproval.tsx`.
- Componentes associados do shadcn/ui: Formulários, Inputs, Botões, Toast (para feedback).

**Configuração e Dependências:**
- `@supabase/supabase-js` para integração com auth do Supabase.
- `react-hook-form` e `zod` para validação de formulários de login/registro.

**Rotas e Navegação:**
- `/auth`: Tela de login/registro.
- `/profile`: Tela de perfil (Privada).
- `/pending-approval`: Tela de bloqueio para usuários aguardando aprovação (Privada).

**Gerenciamento de Estado:**
- `Context API` via `AuthContext.tsx` para manter e distribuir a sessão do usuário em toda a aplicação.

**Integração com APIs e Contratos de Dados:**
- Supabase Auth: `supabase.auth.signInWithPassword()`, `supabase.auth.signUp()`, `supabase.auth.signOut()`.
- Supabase DB: Consulta à tabela `profiles` baseada no `user.id`.

**Modelos de Dados (TypeScript):**
```typescript
interface UserProfile {
  id: string; // UUID from auth.users
  email: string;
  full_name: string;
  role: 'admin' | 'member' | 'secretary';
  status: 'pending' | 'approved' | 'rejected';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
```

**Tratamento de Erros:**
Captura de exceções do Supabase. Utilização de `useToast()` para exibir erros amigáveis de credenciais inválidas ou e-mail já existente.

---

## Epic 2: Gestão Administrativa e Secretaria

### Documentação Funcional

**Descrição do Epic e seu objetivo de negócio:**
Digitalizar as operações da secretaria da loja, permitindo gerenciamento de documentos, atas de sessão, convocações, certificados e correspondências de forma centralizada e segura.

**Critérios de Aceitação e Definição de Pronto:**
- Existência de um Dashboard de Secretaria.
- Possibilidade de upload, edição e visualização de documentos.
- Disparo/Registro de convocações para sessões.
- Controle de emissão de certificados.
- Interface funcional e responsiva, com dados persistidos no banco.

**Histórias de Usuário:**
1. *Como secretário*, quero fazer upload de atas e documentos *para mantê-los arquivados digitalmente*.
2. *Como secretário*, quero gerar e registrar convocações *para avisar os membros das sessões*.
3. *Como secretário*, quero gerenciar a emissão de certificados *para registrar a evolução dos membros*.

**Regras de Negócio:**
- Apenas usuários com `role` de 'admin' ou 'secretary' têm permissão de escrita.
- Documentos oficiais devem ter registro de data e tipo.

**Casos de Uso:**
- **Principal:** Secretário acessa Dashboard, escolhe "Documentos", faz upload de um PDF e salva.
- **Alternativo:** Falha no upload por tamanho excedido ou formato não suportado.

**Dependências:** Epic 1 (Autenticação baseada em Role).

### Documentação Técnica

**Arquitetura e Estrutura de Componentes:**
- Páginas: `src/pages/CommissionSecretary.tsx`.
- Componentes: `SecretaryDashboard.tsx`, `SecretaryDocuments.tsx`, `SecretaryConvocations.tsx`, `SecretaryCertificates.tsx`, `SecretaryCorrespondence.tsx`.

**Gerenciamento de Estado:**
- `React Query` (`useSecretary.ts` hook) para fetching de dados, caching, invalidation e mutações.

**Integração com APIs e Contratos de Dados:**
- Operações de CRUD na tabela `documents`, `convocations`, `certificates`.
- Utilização do Supabase Storage para armazenamento físico de arquivos PDF/Imagens (upload/download/urls assinadas).

**Modelos de Dados:**
```typescript
interface Document {
  id: string;
  title: string;
  type: 'ata' | 'edital' | 'oficio' | 'outro';
  file_url: string;
  uploaded_by: string; // User ID
  created_at: string;
}
```

**Tratamento de Erros:**
Validação de tamanho do arquivo na submissão, tratamento de erros de API e feedback visual via `Sonner` ou `Toast`.

---

## Epic 3: Controle Financeiro e Chancelaria

### Documentação Funcional

**Descrição do Epic e seu objetivo de negócio:**
Gerenciar a saúde financeira da loja (Tesouraria), acompanhando receitas (mensalidades, doações) e despesas, bem como as obrigações da Chancelaria (timbres, documentação oficial de membros).

**Critérios de Aceitação e Definição de Pronto:**
- Registro de entradas e saídas financeiras.
- Visualização de balanço mensal/anual.
- Gestão de inadimplência (mensalidades em atraso).
- Registros específicos de chancelaria.

**Histórias de Usuário:**
1. *Como tesoureiro*, quero registrar pagamentos de membros *para controlar o fluxo de caixa*.
2. *Como tesoureiro*, quero ver gráficos financeiros *para tomar decisões embasadas*.
3. *Como chanceler*, quero controlar as documentações oficiais *para manter a regularidade da loja*.

**Regras de Negócio:**
- Informações financeiras são estritamente acessíveis apenas para Tesouraria e Administração.

**Casos de Uso:**
- **Principal:** Inserção de uma despesa com comprovante em anexo.

### Documentação Técnica

**Arquitetura e Estrutura de Componentes:**
- Páginas: `src/pages/CommissionFinance.tsx`, `src/pages/CommissionChancellery.tsx`.
- Bibliotecas gráficas: `recharts` para visualização de dashboards financeiros.

**Rotas e Navegação:**
- `/financeiro` e `/chancelaria`.

**Gerenciamento de Estado:**
- Custom hook `useFinancialData.ts` para agrupar e realizar fetch de transações via React Query.

**Integração com APIs:**
- Supabase CRUD para tabela `transactions` (id, amount, type (income/expense), date, description, category, user_id, receipt_url).

---

## Epic 4: Sessões, Frequência e Eventos

### Documentação Funcional

**Descrição do Epic e seu objetivo de negócio:**
Organizar a agenda da loja, planejar sessões e registrar a presença (frequência) dos membros, essencial para progressão. Engloba também a gestão de eventos em geral e o "Copo D'água" (Ágape/confraternização).

**Critérios de Aceitação e Definição de Pronto:**
- Calendário de sessões e eventos.
- Módulo de chamada para registrar presentes, ausentes justificados e não justificados em cada sessão.
- Organização das equipes do "Copo D'água" para cada sessão.

**Regras de Negócio:**
- Somente oficiais (Hospitaleiro, Mestre de Cerimônias, Secretário) podem registrar frequência.

### Documentação Técnica

**Arquitetura e Estrutura de Componentes:**
- Páginas: `src/pages/Events.tsx`, `src/pages/CommissionSessions.tsx`, `src/pages/CommissionAttendances.tsx`, `src/pages/CommissionCopoDagua.tsx`.
- Utilização pesada de componentes de Data/Calendário (`react-day-picker` e `date-fns`).

**Gerenciamento de Estado:**
- Custom hooks: `useEvents.ts`, `useSessions.ts`, `useAttendances.ts`, `useCopoDagua.ts`.

**Modelos de Dados:**
```typescript
interface Session {
  id: string;
  date: string;
  type: 'ordinaria' | 'magna' | 'instrucao';
  degree: number; // 1, 2, 3
  theme?: string;
}

interface Attendance {
  id: string;
  session_id: string;
  user_id: string;
  status: 'presente' | 'ausente' | 'justificado';
}
```

---

## Estrutura Geral do Projeto (Vite, React, TypeScript)

### Configuração e Build (Vite)
O projeto utiliza o Vite como empacotador, proporcionando inicialização instantânea no ambiente de desenvolvimento e builds otimizados via Rollup.

- **Arquivo de configuração:** `vite.config.ts` (ou similar) não está listado na raiz, mas a configuração padrão utiliza o `@vitejs/plugin-react-swc` para compilação super rápida em TS/JS.
- **`package.json` scripts:**
  - `npm run dev`: Inicia o servidor local.
  - `npm run build`: Compila o TypeScript e empacota o código para produção.
  - `npm run preview`: Serve localmente o build gerado em produção para testes.

### Estilização e UI
- Baseado no **Tailwind CSS**, permitindo utility-first styling.
- Arquivo `tailwind.config.ts` configura os tokens de cor, animações e theming dinâmico.
- Os componentes seguem a padronização do **shadcn/ui** (encontrados em `src/components/ui/`), que provê acessibilidade robusta construída sobre o Radix UI.
- Arquivo global `src/index.css` (e `App.css`) contendo configurações globais do Tailwind e variáveis CSS nativas para o modo claro/escuro.

### Estrutura de Diretórios
- `src/assets/`: Imagens estáticas (ex: `charity-work.jpg`, `masonic-hero.jpg`).
- `src/components/`: Componentes reutilizáveis, divididos por domínio (ex: `secretary`, `ui`).
- `src/contexts/`: Provedores globais de estado (`AuthContext.tsx`, `ThemeContext.tsx`).
- `src/hooks/`: Toda a lógica de negócio e data fetching encapsulada. Isolando componentes de side-effects diretos.
- `src/integrations/supabase/`: Instância do cliente Supabase e tipagens geradas (`types.ts`).
- `src/pages/`: Componentes de nível de Rota.

### Considerações de Performance e Otimização
1. **React Query:** Implementa estratégias de cache, pre-fetching e dedplicação de requests. Impede carregamentos desnecessários em navegação pela SPA.
2. **Code Splitting:** O Vite cuida do code splitting a nível de rota/dependências (quando lazy loading do react router é implementado).
3. **SWC:** O Vite usando o compilador SWC em Rust traz grande performance para a experiência do desenvolvedor (Hot Module Replacement muito veloz).

### Instruções de Instalação, Build e Deploy

**Pré-requisitos:**
- Node.js (v18+ recomendado) instalado na máquina.
- Gerenciador de pacotes (`npm`, `yarn`, `pnpm` ou `bun`).

**Passo a passo - Desenvolvimento:**
1. Clone o repositório.
2. Acesse a pasta do projeto: `cd lojaamordapatria`.
3. Instale as dependências:
   ```bash
   npm install
   # ou
   bun install
   ```
4. Crie um arquivo `.env` baseado em um possível `.env.example`, incluindo as chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_key_aqui
   ```
5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

**Passo a passo - Deploy:**
1. Execute a compilação:
   ```bash
   npm run build
   ```
2. O conteúdo estático otimizado será gerado no diretório `dist/`.
3. Envie o conteúdo do diretório `dist/` para a sua plataforma de hospedagem estática preferida (Vercel, Netlify, Cloudflare Pages, AWS S3, etc). Se a plataforma suportar CI/CD com Git, basta configurar o comando de build para `npm run build` e o diretório de saída para `dist`.

---
*Fim da Documentação*