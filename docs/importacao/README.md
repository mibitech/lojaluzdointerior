# Modelos de importação — Mestres Veneráveis e Irmãos

Planilhas-modelo para importar dados em massa via **Supabase Studio → Table Editor → Insert → Import data from CSV**.

Arquivos:
- `worshipful_masters_modelo.csv` → tabela `worshipful_masters`
- `profiles_modelo.csv` → tabela `profiles`

Regras gerais:
- Não inclua a coluna `id` — o banco gera automaticamente (`gen_random_uuid()`).
- Não inclua `created_at` / `updated_at`.
- Datas sempre em `YYYY-MM-DD`.
- Booleanos: `true` / `false` (minúsculo).
- Deixe a célula **vazia** para campos opcionais sem valor (vira `NULL`).
- Salve como **CSV UTF-8 (delimitado por vírgulas)** — se algum texto contiver vírgula, o Excel já coloca aspas automaticamente.
- Importar logado como **admin** (as policies RLS de INSERT exigem papel administrativo).

---

## 1. `worshipful_masters` — Gerenciar Mestres Veneráveis

| Coluna | Obrigatório | Tipo | Regra |
|--------|-------------|------|-------|
| `name` | **Sim** | texto | Nome completo do Venerável |
| `installation_year` | **Sim** | número inteiro | Ano da instalação, ex.: `2024` |
| `term_start_date` | **Sim** | data | Início do mandato, `YYYY-MM-DD` |
| `term_end_date` | Não | data | Fim do mandato; vazio se em exercício |
| `bio` | Não | texto | Biografia curta |
| `achievements` | Não | texto | Realizações da gestão |
| `photo_url` | Não | texto | URL pública da foto (bucket `masters`). Deixe vazio e faça upload depois pela tela |
| `is_active` | Não (padrão `false`) | booleano | `true` apenas para o Venerável **atual** — só um registro deve ter `true` |
| `sort_order` | Não (padrão `0`) | número inteiro | Ordem de exibição; a listagem pública ordena por este campo (`1` = primeiro) |

Atenção: a página pública separa "Venerável atual" (`is_active = true`) dos "Mestres anteriores". Se dois registros vierem com `true`, apenas um aparece como atual.

---

## 2. `profiles` — Irmãos

| Coluna | Obrigatório | Tipo | Regra |
|--------|-------------|------|-------|
| `full_name` | **Sim** | texto | 3 a 200 caracteres |
| `cim` | Não | texto | Exatamente **6 dígitos numéricos**. Mantenha a coluna como **Texto** no Excel para não perder o zero à esquerda |
| `email` | Não | texto | E-mail válido. É apenas um dado do cadastro — **não cria login** |
| `phone` | Não | texto | Formato livre, ex.: `(11) 98765-4321` |
| `graduation` | Não (padrão `Aprendiz`) | texto | Exatamente um de: `Aprendiz`, `Companheiro`, `Mestre`, `Mestre Instalado` |
| `masonic_degree` | Não (padrão `1`) | número inteiro | De `1` a `33` |
| `member_status` | Não (padrão `Ativo`) | texto | Exatamente um de: `Ativo`, `Adormecido`, `Remido` |
| `position` | Não | texto | Cargo — use um dos valores da lista abaixo |
| `commission` | Não | texto | Texto livre, ex.: `Comissão de Educação` |
| `is_director_member` | Não (padrão `false`) | booleano | `true` libera acesso às telas de comissão (`/commission/*`) |
| `photo_url` | Não | texto | URL pública da foto; deixe vazio e envie depois pela tela |
| `user_id` | Não | UUID | **Deixe fora da planilha.** É o vínculo com o login em `auth.users` |

### Valores aceitos em `position`
`Venerável Mestre` · `Primeiro Vigilante` · `Segundo Vigilante` · `Orador` · `Secretário` · `Tesoureiro` · `Chanceler` · `Mestre de Cerimônias` · `Experto` · `Diáconos` · `Cobridor Interno` · `Cobridor Externo` · `Guarda do Templo` · `Porta Estandarte` · `Porta Espadas` · `Bibliotecário` · `Mestre de Harmonia`

---

## 3. Pontos importantes sobre os irmãos importados

**Importar em `profiles` não cria conta de acesso.** O perfil fica sem `user_id` e sem papel em `user_roles`, ou seja: o irmão aparece nas listagens, relatórios de frequência e chancelaria, mas **não consegue fazer login**.

Para dar acesso a um irmão importado, depois da importação:
1. O irmão se cadastra normalmente pela tela de cadastro (ou o admin cria o usuário no Supabase Auth).
2. Vincule o perfil existente ao login preenchendo `profiles.user_id` com o UUID de `auth.users` — senão nasce um perfil duplicado.
3. Conceda o papel em `/commission/management` → aba **Acessos** (Membro / Administrador / Diretoria).

**Duplicidade:** não há restrição de unicidade em `cim` nem em `full_name`. Rodar a importação duas vezes gera registros repetidos. Confira a planilha antes e importe uma única vez.

---

## 4. Conferência pós-importação

```sql
-- Contagem por situação
select member_status, count(*) from public.profiles group by member_status;

-- CIMs fora do formato de 6 dígitos
select id, full_name, cim from public.profiles
where cim is not null and cim !~ '^\d{6}$';

-- CIMs duplicados
select cim, count(*) from public.profiles
where cim is not null group by cim having count(*) > 1;

-- Mais de um Venerável marcado como atual
select count(*) from public.worshipful_masters where is_active = true;
```
