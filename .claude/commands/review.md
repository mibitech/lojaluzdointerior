# /review — Revisão de Código

Faz uma revisão completa do código atual contra os padrões do projeto.

## Uso

```
/review [caminho-opcional]
```

Sem argumento: revisa os arquivos modificados (`git diff`).
Com argumento: revisa o caminho especificado.

## Checklist de Revisão

Execute cada item e reporte o resultado com ✅ (ok), ⚠️ (atenção) ou ❌ (bloqueante).

### Arquitetura MVC
- [ ] Nenhum componente View importa diretamente de `services/`
- [ ] Controllers (hooks) não contêm JSX
- [ ] Services não importam de controllers ou views
- [ ] Fluxo correto: `View → Controller → Service → Supabase`
- [ ] Novos tipos definidos em `{feature}.types.ts`

### TypeScript
- [ ] Zero uso de `any`
- [ ] Props de componentes tipadas com `interface`
- [ ] Retornos de funções async tipados explicitamente
- [ ] Sem `as unknown as Tipo` sem justificativa

### Segurança
- [ ] Nenhum secret hardcoded (chaves, tokens, senhas)
- [ ] Inputs validados com zod antes de persistir
- [ ] RLS configurado para toda tabela nova
- [ ] `service_role` não exposto no client-side

### Qualidade
- [ ] Sem `console.log` esquecido
- [ ] Erros tratados — sem `catch(e) {}`
- [ ] Sem código comentado ou `TODO` sem issue associada
- [ ] `useEffect` com cleanup quando necessário (event listeners, subscriptions)

### Performance
- [ ] Sem `select('*')` no Supabase
- [ ] Imagens com `alt`, `width`, `height` e `loading="lazy"`
- [ ] Componentes pesados com `React.lazy`

### Acessibilidade
- [ ] Elementos interativos acessíveis por teclado
- [ ] Imagens com `alt` descritivo
- [ ] Atributos `aria-*` do Radix UI preservados

## Saída Esperada

Liste os itens com problema com:
1. Localização exata (arquivo + linha)
2. Descrição do problema
3. Sugestão de correção
