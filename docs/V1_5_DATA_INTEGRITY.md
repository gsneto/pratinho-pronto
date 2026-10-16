# V1.5 — Integridade de dados, regras de negócio e sincronização

Execução com Browser MCP contra o QA local de fixtures
(`http://127.0.0.1:4178`, `production:false`). Inspeção por árvore de
acessibilidade e por leitura direta do estado (sem capturas repetidas).

## A. Geração da lista de compras — agora atômica

- **Risco reproduzido (código):** `generateShoppingList` fazia upsert da lista +
  delete dos itens + insert dos itens em três chamadas. Uma falha entre o delete
  e o insert deixava a lista vazia (perda de dados). Não é atômico no banco real.
- **Correção:** migração aditiva
  `supabase/migrations/20261011000000_add_replace_shopping_list_rpc.sql` cria
  `replace_shopping_list(p_meal_plan_id uuid, p_items jsonb) returns uuid`, uma
  função plpgsql que substitui tudo em uma única transação.
- **Segurança:** `SECURITY INVOKER` (padrão) — roda como o usuário autenticado e
  **mantém a RLS**; não há bypass. Valida `auth.uid()` e a posse do cardápio,
  com erros explícitos (`not_authenticated`, `meal_plan_not_found`).
  `revoke ... from public; grant execute ... to authenticated`.
- **Cliente:** `src/services/shoppingLists.ts` chama a RPC (`client.rpc`).
- **Validação no navegador:** confirmar a atualização → lista recalculada
  (36 itens, marcações zeradas). Falha simulada (503 na RPC) → alerta
  "Sua lista anterior foi mantida" e a lista permanece intacta (36 itens, 1
  marcado). O servidor de QA local ganhou um handler equivalente para a RPC
  (`qa/store.mjs`, ignorado pelo Git).
- **Pendente:** a migração **não** foi aplicada em produção; a atomicidade real
  depende de aplicar a migração no Supabase (validar RLS/RPC lá).

## B. Confirmação antes de atualizar a lista

- **Semântica real:** atualizar recalcula quantidades do cardápio, **descarta
  itens adicionados manualmente** (pela despensa) e **zera as marcações de
  comprado**.
- **Correção:** `src/components/ui/ConfirmDialog.tsx` (reutilizável, acessível:
  foco preso, Escape, retorno de foco). `ShoppingListPage` só confirma quando
  já existe lista a substituir e o texto descreve exatamente o que muda.
- **Falha:** preserva a lista anterior (RPC atômica) e informa; não promete
  sucesso. Submissões duplicadas ficam desabilitadas durante a operação.
- **Testes:** abrir/cancelar/confirmar/falha em
  `src/pages/ShoppingList/ShoppingListPage.test.tsx`.

## C. Restrições alimentares semânticas

- **Limitação confirmada:** "vegetariano" era tratado como termo textual e nunca
  casava com "Carne bovina" — não bloqueava carne.
- **Correção:** `src/lib/diet/classification.ts` classifica os ingredientes do
  catálogo (editorial, por nome normalizado): `animal_flesh` (carne, frango,
  peixe, peru), `animal_product` (ovo, iogurte), `plant`, e `unknown`.
- **Regras suportadas:** `vegetariano` exclui `animal_flesh`; `vegano` exclui
  `animal_flesh` + `animal_product`. Tokens ambíguos ("sem carne") **não** são
  interpretados.
- **Conservador:** ingrediente não classificado é tratado como **não seguro**
  sob restrição ativa.
- **Aplicação:** `isRecipeCompatible` (usada por geração, troca e despensa).
  Inclusão manual (detalhe da receita) avisa o conflito no planejador, mas
  continua sendo escolha explícita do usuário.
- **Estado vazio:** sem alternativas compatíveis, o modal de troca mostra
  "Nenhuma outra opção compatível" e a despensa mostra "Nenhuma combinação
  encontrada".
- **Validação no navegador:** restrição "vegetariano" → regerar a semana → 28
  refeições, **0 receitas com carne**; troca e despensa respeitam a regra.
- **Pendente:** a classificação é editorial e precisa de revisão; não é alegação
  nutricional nem comprova ausência de alérgenos.

## D. Reconciliação de favoritos online/offline

- **Problema da V1.4:** unir local + remoto podia reintroduzir uma remoção
  antiga.
- **Modelo:** o servidor é a fonte de verdade; o local guarda (a) cache do
  último estado confirmado e (b) **fila de operações pendentes** (delta por
  item). `src/lib/favorites/pending.ts` + `src/services/favorites.ts`.
- **Comportamento:** favoritar/desfavoritar offline registra a intenção; a
  remoção esconde o item e **não reaparece** quando o servidor volta; a fila é
  sincronizada e limpa por item; falha parcial mantém só o que falhou.
- **UI:** atualização otimista no hook (`useFavorites.ts`) torna o coração
  imediato mesmo offline.
- **Validação no navegador:** favoritar online → desfavoritar com a rede
  bloqueada (503) → coração muda na hora e fica pendente → rede volta + reload →
  item continua removido e o servidor é sincronizado (`[]`).
- **Pendente:** comportamento multi-dispositivo não foi comprovado (testado só
  localmente/em memória).

## Testes

`npm test` 189/189 (+26). `qa:flows` 24/24, `qa:audit` 60/60 (0 axe),
`qa:dialogs` 12/12. Lint e build limpos.

## Migrações não aplicadas

- `20261011000000_add_replace_shopping_list_rpc.sql` — criar a RPC no Supabase.
- `20261010000000_add_recipe_review_status.sql` (V1.2) — segue pendente.
