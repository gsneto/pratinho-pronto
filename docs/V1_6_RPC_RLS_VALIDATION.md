# V1.6 — Validação real da RPC, RLS e integridade de dados

Validação executada contra **PostgreSQL 17 real** em container Docker descartável,
não contra fixtures. Ambiente isolado da produção (ver abaixo).

## 1. Ambiente e isolamento

- Docker Desktop iniciado localmente; container efêmero `postgres:17` na porta
  55432, removido ao fim de cada execução.
- **Nada de produção**: sem `supabase link`, sem `db push` remoto, sem
  credenciais reais, sem `service_role` como atalho de autorização.
- Como o projeto não tinha Supabase CLI/Docker ativos, usamos um **mecanismo de
  teste equivalente** (permitido pela missão): um shim local que reproduz o
  mínimo do Supabase — papéis `anon`/`authenticated`/`service_role`, schema
  `auth` com `auth.users` e `auth.uid()` (idêntico ao do Supabase: lê
  `request.jwt.claim.sub`), e `storage` mínimo. A identidade é trocada com
  `SET ROLE` + `set_config('request.jwt.claim.sub', ...)`, reproduzindo
  `auth.uid()` e o papel SQL.
- Arquivos: `supabase/tests/local_shim.sql`, `supabase/tests/shopping_list_rpc.sql`,
  runner `scripts/db-integration-test.mjs` (`npm run db:test`).

## 2. Migrações aplicadas (base limpa)

| Migração | Resultado |
|---|---|
| 20260825200000_initial_schema | OK |
| 20260826013000_expand_recipe_catalog | **FAIL** |
| 20260826050000_add_private_baby_photos | OK |
| 20260827100000_add_recipe_favorites | OK |
| 20260827103000_remove_prototype_language | OK |
| 20260828190000_add_purchase_access_grants | OK |
| 20260913120000_rewrite_demo_descriptions | OK |
| 20260913200000_enrich_recipe_instructions | OK |
| 20261010000000_add_recipe_review_status | OK |
| **20261011000000_add_replace_shopping_list_rpc** | **OK** |

### Defeito de ordenação (pré-existente, fora do V1.5)

`20260826013000_expand_recipe_catalog.sql` insere 48 receitas e, ao final, exige
≥72 (`is_demo`). Como o Supabase roda **migrações antes do seed**, as 24 receitas
do `seed.sql` ainda não existem → `Catálogo incompleto: ... encontradas 48` →
`supabase db reset` falha em base limpa. A migração pressupõe o seed já aplicado.
**Recomendação:** mover a checagem de ≥72/desequilíbrio para o seed (ou torná-la
tolerante à ausência do seed). Não foi alterada aqui para não mexer em migração
histórica fora do escopo da V1.5.

## 3. Testes reais da RPC e RLS (20 verificações, todas PASS)

- **A — sucesso:** dono atualiza; retorno = id da lista; itens persistidos;
  quantidade fracionária (1.5 colher de sopa) preservada; repetir não duplica.
- **B — atomicidade:** gatilho de teste injeta falha **depois do delete** (só no
  banco descartável, removido em seguida); a RPC aborta e a lista anterior fica
  **intacta** (2 itens, Banana=2). Comprova rollback de modificação parcial.
- **C — isolamento:** B não substitui a lista de A (`meal_plan_not_found`);
  B não lê itens nem a lista de A (RLS); sem `auth.uid()` → `not_authenticated`;
  **anon → `permission denied`** (após a correção abaixo).
- **D — payloads/limites:** lista vazia limpa; cardápio inexistente; ingrediente
  inexistente (FK) + rollback; quantidade 0 (check); payload malformado.

Também confirmado que a RPC é **SECURITY INVOKER** (a RLS vale dentro dela) e que
o gatilho de `access_grants` impede criar usuário sem compra aprovada (o teste
simula a compra antes).

## 4. Correção implementada

**`fix: revoke RPC execute from anon role`.** O Supabase concede EXECUTE em
funções novas a `anon`/`authenticated`/`service_role` via default privileges; o
`revoke ... from public` **não** removia o grant de `anon`. Assim, `anon` podia
executar `replace_shopping_list` (rejeitado com `not_authenticated`, mas
executável). A migração agora revoga explicitamente de `anon`. Validado: `anon`
passa a receber `permission denied`; só `authenticated` executa.

## 5. Frontend

`src/services/shoppingLists.ts` chama `client.rpc('replace_shopping_list', { p_meal_plan_id, p_items })` — payload compatível com a assinatura SQL. Não há
caminho antigo não-atômico. Erro da RPC preserva a lista e informa; a UI só
atualiza após o sucesso confirmado.

## 6. Limitações

- O shim reproduz `auth.uid()`/papéis, mas não o GoTrue/PostgREST reais; a
  migração **não foi aplicada** em produção.
- Concorrência real (duas transações simultâneas) não foi exercitada.
- Favoritos multi-dispositivo: comportamento não comprovado (testado em memória).
- `expand_recipe_catalog` requer o seed (defeito de ordenação documentado).
