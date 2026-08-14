# /security-check — Auditoria de Segurança

Executa uma auditoria focada em segurança no projeto ou no escopo especificado.

## Uso

```
/security-check [caminho-opcional]
```

## Áreas de Verificação

### 1. Exposição de Secrets
- Busque por padrões: `sk_`, `pk_`, `SUPABASE_SERVICE`, `password =`, `apiKey =`
- Verifique se `.env` está no `.gitignore`
- Verifique se não há `.env` commitado no histórico Git

### 2. Supabase RLS
- Liste todas as tabelas em `supabase/migrations/`
- Confirme que toda tabela tem `ENABLE ROW LEVEL SECURITY`
- Confirme que toda tabela tem ao menos uma policy definida
- Verifique se políticas usam `auth.uid()` e não dados client-side

### 3. Autenticação e Sessão
- Rotas protegidas verificam sessão Supabase Auth antes de renderizar
- `service_role` não é importado em código client-side (`src/`)
- Tokens não são armazenados em `localStorage` manualmente

### 4. Validação de Entrada
- Toda Edge Function valida input com zod
- Formulários validam no client (UX) E no servidor (segurança)
- Sem interpolação direta de input do usuário em queries SQL

### 5. OWASP Top 10 — Verificações Rápidas
- **A1 Broken Access Control**: RLS + verificação de ownership nas queries
- **A2 Cryptographic Failures**: HTTPS sempre, sem dados sensíveis em URL
- **A3 Injection**: sem SQL dinâmico, sem `eval()`, sem `dangerouslySetInnerHTML` sem sanitização
- **A5 Security Misconfiguration**: variáveis de ambiente corretas por ambiente
- **A7 XSS**: sem renderização de HTML não sanitizado vindo de input do usuário

### 6. Dependências
- Rode `pnpm audit` e reporte vulnerabilidades `high` e `critical`
- Identifique dependências desatualizadas com risco de segurança

## Saída Esperada

Para cada problema encontrado:
- **Severidade**: Critical / High / Medium / Low
- **Localização**: arquivo + linha
- **Descrição**: o que está exposto e por quê é um risco
- **Correção**: ação específica para resolver
