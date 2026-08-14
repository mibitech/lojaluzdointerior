# /epic — Iniciar um Épico do PRD

Lê um épico do PRD, decompõe em User Stories e prepara o plano de execução.

## Uso

```
/epic <nome-ou-numero-do-epico>
```

Exemplo: `/epic autenticacao` ou `/epic E1`

## O que executar

### 1. Leitura do PRD

- Leia `docs/prd.md` e localize o épico correspondente a `$ARGUMENTS`
- Extraia: objetivo do épico, User Stories, critérios de aceite, dependências

### 2. Decomposição

Para cada User Story, identifique:
- Quais **arquivos** precisam ser criados ou modificados (MVC layers)
- Qual **modo** deve executar: Architect (estrutura nova) / Code (implementação) / Test (testes)
- Quais **dependências** existem entre as stories (o que precisa existir antes)

### 3. Checklist de Pré-Trabalho

- [ ] Estrutura de diretórios existe ou será criada pelo Architect?
- [ ] Migrations necessárias identificadas?
- [ ] MCPs necessários disponíveis (Supabase, Stripe, Brevo)?
- [ ] Variáveis de ambiente necessárias documentadas?

### 4. Plano de Execução

Apresente um plano ordenado no formato:

```
Épico: <nome>
Objetivo: <uma frase>

Stories (em ordem de execução):
1. [Architect] Criar estrutura de diretórios para <feature>
2. [Code] Implementar <US-01>: <descrição>
3. [Code] Implementar <US-02>: <descrição>
4. [Test] Escrever testes para <feature>
5. [Debug] Validar fluxo completo no browser

Critérios de Aceite:
- <lista do PRD>

Checklist de QA ao final:
- [ ] Todos os critérios de aceite verificados
- [ ] pnpm build sem erros
- [ ] Fluxo crítico testado manualmente
```

Aguarde confirmação do plano antes de executar qualquer tarefa.
