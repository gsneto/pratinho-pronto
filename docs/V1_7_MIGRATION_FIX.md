# V1.7 — Correção das migrações e reconstrução reproduzível do banco

## 1. Causa exata da falha de reconstrução

`supabase/migrations/20260826013000_expand_recipe_catalog.sql` (migração de
expansão) tinha dois problemas de **inversão de dependência** com o seed:

1. **Validação prematura.** Ao final, um bloco `do $$` exigia `>= 72` receitas
   (`is_demo`). O Supabase aplica **migrações antes do seed**: no momento da
   migração só existiam as 48 receitas que ela mesma insere → `Catálogo
   incompleto: esperadas ao menos 72 receitas, encontradas 48` → `db reset`
   abortava.
2. **Dependência de dados do seed.** A migração inseria apenas **3** dos
   ingredientes (Couve, Flocão de milho, Pêssego) e fazia
   `insert into recipe_ingredients ... join public.ingredients` esperando os
   **33** ingredientes do seed já existirem. Como as migrações rodam antes do
   seed, os vínculos de ingrediente das 48 receitas não eram criados.

Mover apenas a validação não bastaria: a base limpa terminaria com receitas sem
ingredientes. Era necessário tornar a migração autossuficiente **e** mover a
validação para o fim.

## 2. Estratégia adotada

- **Migração de expansão autossuficiente:** ela agora define o catálogo completo
  de **36 ingredientes** (mesma lista do seed), com `on conflict do update`.
  Assim funciona mesmo sem o seed e, ao rodar o seed depois, os valores
  coincidem.
- **Validação movida para o seed:** o bloco de verificação (≥72 receitas, sem
  receita sem ingrediente obrigatório, ≥18 por tipo de refeição e — acrescentado
  — **sem nomes duplicados**) agora vive no fim de `supabase/seed.sql`, que roda
  depois de todas as migrações. As validações continuam existindo; mudou apenas
  o momento.
- **Não reduzimos 72 para 48** e não dependemos de dados inseridos manualmente.

## 3. Efeitos

- **Base nova:** `db reset` aplica 10 migrações + seed, sem erros, terminando
  com **72 receitas e 36 ingredientes**, todas as receitas com ingrediente
  obrigatório, 18 por tipo, sem duplicatas.
- **Base já migrada:** a migração de expansão já está registrada como aplicada;
  as mudanças são aditivas e idempotentes (`on conflict do update`), sem
  alteração de esquema e sem remoção de dados. Nenhuma ação é necessária, exceto
  se houver receitas de expansão sem vínculos de ingrediente criadas por uma
  aplicação anterior — nesse caso, reaplicar o `insert ... join ingredients`
  (o próprio conteúdo da migração) faz o backfill.
- A validação adicional no seed não quebra bases existentes: roda apenas quando
  o seed é executado.

## 4. Arquivos alterados

- `supabase/migrations/20260826013000_expand_recipe_catalog.sql` — ingredientes
  completos; bloco de validação removido.
- `supabase/seed.sql` — validação final do catálogo adicionada.
- `supabase/catalog.test.ts` — teste de autossuficiência (ingredientes usados ⊆
  definidos na migração; seed ⊆ migração).
- `supabase/tests/catalog_clean_base.sql` — valida a base limpa (contagens).
- `supabase/tests/concurrency.sh` + `supabase/tests/concurrency/*.sql` —
  concorrência.
- `supabase/tests/shopping_list_rpc.sql` — ingredientes do teste renomeados
  (não colidem com o catálogo real).
- `scripts/db-integration-test.mjs` — agora aplica o seed e roda testes `.sh`.
- `scripts/supabase-e2e.mjs` — e2e real (GoTrue + PostgREST).
- `package.json` (`db:test`, `db:e2e`), `.gitignore` (`supabase/.branches/`).

## 5. Reconstrução desde uma base vazia

- **Supabase CLI real** (`supabase@2.120.0`): `npx supabase start` + `npx
  supabase db reset` → **concluído com sucesso**, aplicando as 10 migrações e o
  seed. Antes, esta era exatamente a operação que falhava.
- Estado final verificado no Postgres do Supabase: **72 receitas, 36
  ingredientes, 0 nomes duplicados, 0 receitas sem ingrediente obrigatório,
  mínimo 18 por tipo, 198 vínculos de ingrediente**.
- **Runner portátil** (`npm run db:test`, container Postgres descartável):
  10/10 migrações OK, seed OK, catálogo OK (6 verificações).

## 6. Testes da RPC e RLS reexecutados

- **Container Postgres** (`shopping_list_rpc.sql`, 20 verificações): sucesso,
  atomicidade com rollback em falha injetada, isolamento entre dois usuários,
  sem auth, `anon` bloqueado, payloads inválidos, sem duplicação, quantidade
  fracionária. Todos PASS.
- **Stack Supabase real** (`npm run db:e2e`): signup via **GoTrue** (JWT real) →
  RPC via **PostgREST** com `Authorization` → 200 e itens persistidos; usuário B
  → **403** (RLS) e lista de A intacta; `anon` → **401**. Todos PASS.

## 7. Concorrência

Teste real (`supabase/tests/concurrency.sh`): dois workers substituem a **mesma**
lista; o worker A segura o lock da linha e espera, o B bloqueia até A commitar e
então substitui tudo. Resultado: a lista final corresponde **exatamente a um dos
payloads** (sem mistura) e **sem duplicatas**. Não foi necessário adicionar
bloqueios nem controle de versão — o lock implícito do `upsert`/`delete` já
serializa.

## 8. Regressão

`npm test` 190/190 · `npm run db:test` 0 falhas · `npm run db:e2e` PASS ·
`npm run lint` limpo · `npm run build` OK · `qa:flows` 24/24 · `qa:audit` 60/60
(0 axe) · `qa:dialogs` 12/12.

## 9. Limitações

- O `db:e2e` requer o stack local (`supabase start`) ativo.
- `qa/` (fixtures locais) é ignorado pelo Git; o leitor de catálogo do QA foi
  ajustado para deduplicar ingredientes (definidos em dois arquivos agora).
- A migração não foi aplicada em produção; apenas validada em ambiente local.

## 10. Produção

Intacta. Nenhum `db push` remoto, nenhuma credencial de produção, nenhum deploy.
Todo o trabalho rodou em containers locais descartáveis e no repositório.
