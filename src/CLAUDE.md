# src/ — Frontend (React + TypeScript + Vite)

Regras específicas do código frontend. As regras globais do projeto estão no `CLAUDE.md` raiz.

---

## TypeScript

- Modo `strict` — nunca desabilite flags de rigor
- `interface` para props e modelos de dados; `type` para uniões e utilitários
- Nunca use `any` — use `unknown` com narrowing ou tipos explícitos
- Evite `enum` — use `as const` ou uniões de string literais
- Named exports em todos os módulos (evite `default export` em features)

## React — Padrões

- Componentes funcionais com props tipadas via `interface`
- `useEffect` apenas para sincronização com sistemas externos (não para derivar estado)
- Estado derivado: calcule no render ou com `useMemo` — não use `useEffect` + `useState`
- `useMemo` / `useCallback` apenas quando o custo for mensurável — profile antes de otimizar
- `React.lazy` + `Suspense` para todas as rotas e modais pesados
- Listas longas (> 50 itens): use `@tanstack/virtual`

## Estado

```
useState      → dados de UI e formulários locais
useReducer    → estado com múltiplas transições relacionadas
Context API   → estado global (auth, tema, configurações)
```

Sem Zustand / Redux salvo decisão arquitetural registrada em `docs/decisions/`.

## UI — Shadcn + Tailwind

- Shadcn UI para todos os componentes — nunca reinvente primitivos acessíveis
- Tailwind para layout, espaçamento e tipografia — sem valores arbitrários sem necessidade
- Mobile-first obrigatório: `base → sm: → md: → lg:`
- Dark mode via variantes `dark:` em todos os componentes
- Tokens do design system sobre valores hardcoded

## Acessibilidade

- HTML semântico primeiro: `<nav>`, `<main>`, `<button>`, `<a>` antes de ARIA
- Nunca remova atributos `aria-*` gerados pelo Radix UI
- Focus ring visível — nunca `outline: none` sem alternativa
- `alt` descritivo em imagens informativas; `alt=""` em decorativas
- Formulários: `<label>` associado + `aria-describedby` nos erros
- Respeite `prefers-reduced-motion` em animações

## Performance

Metas Core Web Vitals: LCP < 2.5s · INP < 200ms · CLS < 0.1 · Lighthouse ≥ 90

- Bundle JS inicial ≤ 200 KB (gzip) — verifique com `vite-bundle-analyzer`
- Imagens: WebP/AVIF, `width`/`height` explícitos, `loading="lazy"`
- `fetchpriority="high"` na imagem hero (LCP)
- Fontes: `preload` + `font-display: swap`

## Tratamento de Erros

- `<ErrorBoundary>` por feature/rota — nunca apenas um global
- Nunca engula erros silenciosamente: `catch(e) {}` é proibido
- Mensagens ao usuário: amigáveis, acionáveis, sem stack traces
- Preserve valores do formulário após erro — nunca limpe tudo
- `aria-live="polite"` para notificações dinâmicas (toasts, erros)

## Testes de Componentes

- React Testing Library — teste comportamento, não implementação
- Co-localizado: `features/auth/__tests__/useAuth.test.ts`
- Seletores por papel: `getByRole('button', { name: 'Entrar' })`
- Sem snapshot tests para conteúdo dinâmico
- `vitest-axe` nos componentes críticos para regressão de acessibilidade
