# e2e/ — Testes End-to-End (Playwright)

Regras específicas para testes E2E. As regras globais estão no `CLAUDE.md` raiz.

---

## Filosofia

Teste apenas **fluxos críticos de negócio** — não substitua testes de unidade com E2E.
Cada teste E2E deve corresponder a uma jornada real do usuário.

**Fluxos obrigatórios por tipo de app:**
- Auth: cadastro, login, logout, recuperação de senha
- Core: criação e leitura do recurso principal do produto
- Billing: checkout completo (modo test do Stripe)
- Erro: tela de erro, recuperação de sessão expirada

## Estrutura de Arquivos

```
e2e/
├── fixtures/
│   ├── auth.ts          # helpers: createUser, loginAs, logout
│   └── data.ts          # factories: createOrder, createProduct
├── pages/               # Page Object Model
│   ├── LoginPage.ts
│   └── DashboardPage.ts
├── tests/
│   ├── auth.spec.ts
│   ├── checkout.spec.ts
│   └── dashboard.spec.ts
└── playwright.config.ts
```

## Page Object Model

```typescript
// e2e/pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('E-mail').fill(email)
    await this.page.getByLabel('Senha').fill(password)
    await this.page.getByRole('button', { name: 'Entrar' }).click()
  }

  async expectError(message: string) {
    await expect(this.page.getByRole('alert')).toContainText(message)
  }
}
```

## Seletores — Ordem de Preferência

```typescript
// 1. Papéis acessíveis (preferido)
page.getByRole('button', { name: 'Finalizar compra' })
page.getByLabel('E-mail')

// 2. Texto visível
page.getByText('Pedido confirmado')

// 3. data-testid (último recurso — quando semântica não for suficiente)
page.getByTestId('order-summary')
```

Nunca use seletores CSS frágeis: `.btn-primary`, `#root > div > span`.

## Fixtures e Isolamento

```typescript
// e2e/fixtures/auth.ts
export async function createTestUser(supabase: SupabaseClient) {
  const email = `test-${Date.now()}@example.com`
  const { data } = await supabase.auth.admin.createUser({ email, password: 'Test@1234' })
  return { email, userId: data.user!.id }
}
```

- Crie usuário e dados via API antes de cada teste — nunca reutilize estado entre testes
- Limpe dados criados no `afterEach` ou use banco de testes descartável
- Nunca dependa de ordem de execução entre testes

## Configuração (`playwright.config.ts`)

```typescript
export default defineConfig({
  fullyParallel: true,          // paralelize sempre
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',    // grava trace em falhas — facilita debug
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## CI

- E2E apenas em merge para `main` ou em ambiente de staging
- Unit + integração em todo PR
- Artefatos de falha (screenshots, vídeos, traces) salvos como CI artifacts
- Use `pnpm exec playwright install --with-deps` no CI para instalar browsers

## Debugging

```bash
pnpm exec playwright test --ui          # UI mode — visual e interativo
pnpm exec playwright test --debug       # modo debug passo a passo
pnpm exec playwright show-report        # relatório HTML da última run
```
