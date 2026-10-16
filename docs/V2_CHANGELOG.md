# Pratinho Pronto — V2 (evolução incremental)

Continuação do produto existente sobre a branch
`feat/pratinho-ux-polish-20261009`. Sem alteração de produção.

## Escopo desta rodada

A V2 priorizou **utilidade, confiabilidade, coerência e manutenibilidade** em
cima do que já existia, sem reconstruir o app nem introduzir recursos de
pagamento/administração.

## Melhorias funcionais

### Home como central de planejamento
- Resumo real da semana: **refeições planejadas**, **dias com refeição (x/7)** e
  **progresso da lista de compras (x/y)**, com cada indicador linkando para a
  página correspondente (`/app/week`, `/app/shopping-list`).
- Usa somente dados reais (cardápio + lista); nada é inventado. O bloco só
  aparece quando há semana montada. `src/pages/Home/HomePage.tsx`.

### Semana — opções extras
- A segunda refeição do mesmo tipo no dia agora exibe o selo **"Opção extra"**
  em "Resto do dia", distinguindo refeições planejadas de adições manuais.
  `src/pages/MealPlan/MealPlanPage.tsx`.

### PDF do cardápio
- Corrigido: o PDF usava `find()` por tipo e **descartava as opções extras**,
  embora a tela as mostre. Agora imprime todas as refeições do dia/tipo.
  Extraído `mealCellItems` em `src/lib/meal-plan/week-print.ts`.

## Documentação

- `README.md` corrigido: React 19 (era 18), autenticação por e-mail/senha (era
  magic link), fluxo de `access_grants`, estrutura de pastas atual
  (`lib/diet`, `lib/favorites`; removida `Subscription` inexistente) e comandos
  `db:test`/`db:e2e`.

## Verificações já consolidadas nas versões anteriores (preservadas)

- Busca de receitas sem acento; favoritos com fila de operações pendentes;
  confirmação antes de substituir a lista; RPC `replace_shopping_list` atômica
  (SECURITY INVOKER, RLS); restrições vegetarianas/veganas por classificação de
  ingredientes; migração do catálogo autossuficiente + validação no seed.

## Testes

| Suíte | Resultado |
|---|---|
| `npm test` | 194/194 |
| `npm run lint` / `build` | limpos |
| `qa:flows` (chromium) | 24/24 |
| `qa:audit` (chromium) | 60/60 (0 axe) |
| `qa:dialogs` (chromium) | 12/12 |
| `npm run db:test` (PostgreSQL real) | 0 falhas (20 + 6 + 1 verificações) |

Testes adicionados nesta rodada: resumo da Home (contagens + links), PDF com
múltiplas refeições por célula, selo de opção extra.

## Validação via Browser MCP

- Home: resumo com 28 refeições, 7/7 dias, 0/36 itens; links corretos; 0 erros
  de console.
- Semana: selo "Opção extra" visível após adicionar uma receita como opção extra.

## Limitações que permanecem

- **Persistência real** validada apenas no PostgreSQL local/Supabase local; o
  Supabase de produção não foi exercitado.
- **Revisão de conteúdo** do catálogo (idade, textura, cortes, alergênicos) por
  nutricionista/pediatra segue pendente (`docs/catalogo-revisao-profissional.md`).
- Restrições reconhecem apenas tokens explícitos (`vegetariano`/`vegano`);
  termos ambíguos como "sem carne" não são interpretados (por segurança).
- Concorrência validada no PostgreSQL local; multi-dispositivo não comprovado.

## Próximas melhorias recomendadas (V2.1)

1. Item manual na lista de compras (com migração aditiva e testes).
2. Reordenar/organizar refeições de um dia na Semana.
3. Filtro de favoritas e busca combinada com melhor estado vazio.
4. Revisão do catálogo por profissional + `content_review_status` consumido na UI.
5. Aplicar as migrações pendentes no Supabase de produção (fora do escopo aqui).

---

# V2.1 — Experiência do aplicativo em modo local/mock

Continuação sobre a mesma branch `feat/pratinho-ux-polish-20261009`. Nenhuma
alteração de produção: sem migração aplicada, sem mudança de credenciais, sem
tocar na landing page, preços, Cakto, Pixel ou anúncios.

## Como o modo mock funciona

O app **não** é reescrito para o QA. `npm run qa:build` gera um bundle isolado
(`tmp/ui-qa-dist`) que aponta o cliente Supabase para
`http://127.0.0.1:4178/__qa/supabase`; `npm run qa:serve` sobe um servidor
PostgREST simulado **em memória** (`qa/serve.mjs` + `qa/store.mjs`). Ou seja: os
**serviços reais** (`src/services/**`) rodam sem alteração contra um backend
falso. Não é `localStorage` — os itens vivem no backend simulado, com as mesmas
tabelas e RLS-equivalentes por escopo de usuário.

## Melhorias implementadas

### Item manual na lista de compras
- Botão **"Adicionar item"** abre um diálogo para digitar **nome**,
  **quantidade** e **unidade**. O nome é resolvido contra o catálogo
  (sem acento/caixa): se coincidir, o item entra **ligado ao ingrediente**; se
  não, entra como **item livre** (rótulo próprio).
- Cada item ganhou **"Editar"** (quantidade/unidade; o nome só é editável em
  item livre) e **"Remover"**; o item livre é rotulado como **"Item livre"**.
- Quantidades somam em vez de duplicar (mesmo ingrediente+unidade, ou mesmo
  nome livre+unidade) e o progresso `x/y` continua consistente.
- Validação com mensagens claras (nome, quantidade > 0, unidade) e erro
  explícito quando o item não pode ser salvo.

### Reordenar refeições do dia
- A `position` já existia (`unique(meal_plan_id, date, meal_type, position)`).
  Como o dia é ordenado por tipo de refeição (café, almoço, lanche, jantar), a
  reordenação acontece **dentro do mesmo tipo** — a única regra compatível com o
  modelo. Não cruzamos tipos de refeição.
- Setas **"Mover para cima/baixo"** aparecem só quando há irmão do mesmo tipo;
  a tela atualiza na hora (otimista) e o **PDF do cardápio** passa a ordenar a
  célula por `position` (`mealCellItems`), refletindo a ordem escolhida.
- Falha ao salvar reverte a ordem e informa; a identidade e os dados de cada
  refeição são preservados (só a posição muda).

### Favoritos — estado vazio melhorado
- Sem favoritas: estado acolhedor ("Você ainda não salvou favoritas") com
  explicação de como favoritar e ação **"Explorar o catálogo"** (limpa o filtro).
- Com favoritas salvas mas excluídas pelos filtros: mensagem específica
  ("Suas favoritas começam aqui") e "Limpar filtros". A sincronização
  online/offline da V1.5 permanece intacta.

### Estado de revisão do catálogo
- `content_review_status` é lido numa consulta **separada e tolerante**: se a
  coluna não existir no schema (migração pendente), o serviço devolve `null` e a
  interface simplesmente não mostra indicador. **Nenhum serviço de produção
  passou a exigir a coluna.**
- No catálogo: aviso "Catálogo em revisão profissional: N de M receitas ainda
  aguardam revisão…". No detalhe: "Pendente de revisão profissional" (ou
  "Revisão profissional concluída", se o dado disser isso).
- O texto **não** afirma validação clínica nem confunde integridade técnica com
  aprovação por nutricionista/pediatra. Nada é marcado como revisado sem
  evidência.

## Testes

| Suíte | Resultado |
|---|---|
| `npm test` | 246/246 (era 207 antes desta rodada) |
| `npm run lint` / `npm run build` | limpos |
| `qa:flows` (chromium) | 24/24 |
| `qa:audit` (chromium, 6 perfis × 10 rotas) | 60/60 (0 axe, 0 clipping) |
| `qa:dialogs` (chromium) | 18/18 (inclui o novo diálogo de item) |
| `qa:regressions` | 0 falhas |
| `qa:pwa` (chromium) | 18/18 |
| `npm run db:test` | **não executado**: `docker` indisponível no ambiente |

Testes adicionados: item manual (lib + serviço + página), reordenação (lib +
serviço + página), estado vazio de favoritas, status de revisão (lib + serviço +
página), ordenação do PDF por posição.

## Validação via Browser MCP (fixtures locais)

- Lista de compras: item livre "Fraldas" adicionado, editado, marcado e
  removido; item do catálogo "banana" **somou** (3→4) sem duplicar; persistiu no
  backend do mock após recarregar (conferido na API REST simulada).
- Semana: opção extra criada e reordenada; o dia, a lista compacta e o **PDF**
  passaram a exibir "Mingau" antes de "Mamão", com a ordem persistida.
- Favoritos: estado vazio, favoritar, filtro "Favoritas" (1 de 72) e
  persistência do favorito.
- Revisão: indicador no catálogo (72/72 pendentes) e no detalhe.
- Console: 0 erros em todos os passos.

## Limitações e integração futura (dependem do Supabase real)

- **Itens livres**: o schema atual tem `shopping_list_items.ingredient_id NOT
  NULL` e **não** tem coluna de rótulo. O item livre usa `custom_name`, que só
  existe no ambiente local/mock. No schema real, gravar um item livre **falha
  claramente** (nada é fingido como salvo) e a interface orienta escolher um
  nome do catálogo. Habilitar de verdade exige uma migração aditiva:
  `alter table shopping_list_items alter column ingredient_id drop not null;
  add column custom_name text;` + política RLS equivalente. Não foi criada por
  não haver autorização para migrar o banco agora.
- **Ordem das refeições**: persiste de verdade (`position`), sem migração. Vale
  só dentro do mesmo tipo de refeição; cruzar tipos exigiria repensar o modelo
  de horários.
- **`content_review_status`**: a migração `20261010000000` segue **não
  aplicada** em produção. Quando for aplicada, basta o indicador aparecer — a
  consulta já é tolerante. A revisão do conteúdo por nutricionista/pediatra
  continua pendente (`docs/catalogo-revisao-profissional.md`).
- **Persistência real** validada apenas no backend simulado do QA e no
  PostgreSQL local; o Supabase de produção não foi exercitado.
- **`npm run db:test`** não rodou neste ambiente (Docker ausente); não houve
  migração nova, então não há comportamento de banco novo a validar.

---

# V2.2 — Persistência real dos itens manuais da lista de compras

Mesma branch `feat/pratinho-ux-polish-20261009`. A V2.1 entregou os itens manuais
apenas no mock (`custom_name` sem coluna real). Esta rodada **elimina a diferença
entre mock e schema real** com migrações aditivas. Produção não foi tocada.

## Modelo de dados adotado

Um item da lista tem **exatamente uma origem**, garantida por CHECK no banco:

1. **Catálogo:** `ingredient_id` preenchido e `custom_name` nulo.
2. **Manual:** `ingredient_id` nulo e `custom_name` preenchido (1–80 caracteres).

Migrações novas (aditivas, não destrutivas):

- `20261012000000_add_manual_shopping_list_items.sql` — torna `ingredient_id`
  anulável, adiciona `custom_name`, cria o CHECK
  `shopping_list_items_origin_check` e um índice parcial único para itens manuais
  (mesmo nome/unidade). Nenhum registro existente é alterado.
- `20261012010000_replace_shopping_list_preserve_manual_items.sql` — redefine a
  RPC `replace_shopping_list` para apagar **apenas** os itens do cardápio
  (`ingredient_id is not null`) e **preservar** os itens manuais (com a marcação
  de "comprado"). Mantém SECURITY INVOKER, atomicidade e grants.

## Comportamento ao recalcular a lista

"Atualizar com o cardápio" recalcula os itens derivados das receitas e **mantém
os itens livres** que a pessoa adicionou. Os ingredientes extras vindos da
despensa (itens de catálogo) continuam sendo substituídos pelo cálculo — como
antes. O diálogo de confirmação foi atualizado para dizer exatamente isso.

## Compatibilidade

- Tipos e serviços já suportavam `ingredient_id` nulo + `custom_name` (V2.1); a
  leitura continua tolerante caso a coluna ainda não exista (janela antes de a
  migração ser aplicada em produção).
- O mock (`qa/store.mjs`) passou a **rejeitar** itens sem origem ou com as duas
  origens e a **preservar** itens manuais no recálculo — mesmo contrato do banco.

## Testes de banco REAIS (PostgreSQL local, descartável)

Docker não está disponível neste ambiente (`docker` ausente). Para **não simular**
os testes de banco, usei o PostgreSQL 16 instalado no WSL (Ubuntu 24.04), em
bancos descartáveis recriados a cada execução:

- **Base limpa:** as 12 migrações aplicam em ordem e o `seed.sql` roda (validação
  final do catálogo inclusa).
- `catalog_clean_base.sql` (6), `concurrency.sh` (1),
  `shopping_list_manual_items.sql` (**novo**, 18) e `shopping_list_rpc.sql` (20)
  — **45 verificações, 0 falhas**.
- **Registros antigos preservados:** banco criado com as migrações **até** a
  versão anterior, dados no formato antigo inseridos, migração nova aplicada e
  verificado que as linhas seguem válidas e intactas (3 verificações).
- Cobrem: item do catálogo, item manual, editar quantidade/unidade, editar nome,
  marcar comprado, remover, rejeitar registros inválidos, isolamento entre
  usuários (RLS), recalcular preservando manuais, rollback em falha.

## Testes

| Suíte | Resultado |
|---|---|
| `npm test` | 248/248 |
| `npm run lint` / `npm run build` | limpos |
| `qa:flows` (chromium) | 24/24 |
| `qa:audit` (chromium) | 60/60 (0 axe, 0 clipping) |
| `qa:dialogs` (chromium) | 18/18 |
| `qa:regressions` | 0 falhas |
| `qa:pwa` (chromium) | 18/18 |
| Integração PostgreSQL local (WSL) | 45 + 3 verificações, 0 falhas |
| `npm run db:test` (Docker) | não executável (Docker ausente) |
| `npm run db:e2e` (Supabase local) | não executável (exige Docker) |

## Validação via Browser MCP (fixtures locais)

Item livre "Fraldas" adicionado, editado (nome → "Fraldas tamanho M",
quantidade 1→2, unidade "pacote"→"pacote grande"), marcado e conferido após
recarregar; recálculo da lista **preservou** o item manual (marcado) e trocou os
itens do cardápio; ingrediente do catálogo somou (Banana 3→4) sem duplicar; o
**PDF** da lista inclui "Fraldas tamanho M · 2 pacote grande" em "Outros".
Console: 0 erros.

## Pendências e integração real

- As duas migrações novas **não foram aplicadas** em nenhum banco remoto
  (produção intacta). Aplicá-las no Supabase habilita a persistência real dos
  itens manuais; até lá, a leitura tolerante mantém o app funcionando.
- Validação em PostgreSQL **local** (WSL); o Supabase de produção não foi
  exercitado e `db:e2e` não rodou (Docker ausente).

---

# V2.3 — Revisão de integração e prontidão para lançamento

Mesma branch `feat/pratinho-ux-polish-20261009`. Revisão de ponta a ponta do
contrato frontend–backend. Sem redesign e sem produção alterada.

## Incompatibilidades encontradas e corrigidas

### 1. Despensa reenviava itens manuais e violava a origem (corrigido)
- **Defeito:** `appendShoppingListItems` (usado por "Adicionar faltantes à
  lista", na despensa) relia **todos** os itens e os reenviava no upsert. Depois
  da V2.2, um item manual relido vem sem `custom_name`; reenviá-lo como
  `ingredient_id` nulo e `custom_name` nulo viola o CHECK
  `shopping_list_items_origin_check` — e a lista inteira falhava. Reproduzido no
  backend do QA (a origem inválida é recusada, espelhando o banco).
- **Correção:** o merge/upsert passa a considerar apenas itens **do catálogo**;
  os manuais são preservados e não são tocados.
- **Extra:** ao incluir um item do catálogo, `custom_name` deixa de ser enviado
  (fica nulo por padrão), então a inclusão também funciona num schema que ainda
  não recebeu a migração de itens manuais.

### 2. Troca de posições colidia com 3+ refeições do mesmo tipo (corrigido)
- **Defeito comprovado em PostgreSQL real:** a posição temporária era
  `max(das duas trocadas) + 1`. Com uma terceira refeição do mesmo dia/tipo, ela
  coincidia com a posição dela e o índice único
  `(meal_plan_id, date, meal_type, position)` recusava a troca (`duplicate key`).
  Além disso, os 3 updates separados não eram atômicos: falha no meio deixava a
  ordem inconsistente, em silêncio.
- **Correção:** nova migração
  `20261012020000_add_swap_meal_plan_item_positions_rpc.sql` cria
  `swap_meal_plan_item_positions(p_first, p_second)` — SECURITY INVOKER, valida
  identidade/posse/mesmo slot, calcula uma posição temporária **livre** dentro do
  grupo e troca tudo em uma transação. O serviço passa a chamar a RPC.

### 3. Harness de QA não versionado (corrigido)
- **Defeito:** o `.gitignore` excluía `qa/`, mas `package.json` (scripts `qa:*`),
  o `README.md` e o `vitest` (3 arquivos `qa/*.test.ts`) dependem dele. Um clone
  limpo não conseguia rodar a suíte de QA nem a suíte unitária completa.
- **Correção:** `qa/` passou a ser versionado (o `.gitignore` só ignora
  resultados gerados: `entregaveis/`, `output/`, `screenshots/`, `__pycache__/`).

## Migrações revisadas

Ordem de aplicação e dependências conferidas. Treze migrações, todas aplicam em
**base limpa** e a `20260826013000` (correção da V1.7) continua autossuficiente
(define os ingredientes que usa). As de itens manuais e a de reordenação são
**aditivas**; nenhuma altera a semântica de migração já aplicada. Uma base já
inicializada recebe apenas o que falta (verificado por teste de preservação).

Pendentes de aplicar em produção: `20261010000000` (review status),
`20261012000000`, `20261012010000` (itens manuais) e `20261012020000`
(reordenação atômica).

## Testes realmente executados

| Suíte | Resultado |
|---|---|
| `npm test` | 250/250 (era 248) |
| `npm run lint` / `npm run build` | limpos |
| `qa:flows` (chromium) | 24/24 |
| `qa:audit` (chromium) | 60/60 (0 axe, 0 clipping) |
| `qa:dialogs` (chromium) | 18/18 |
| `qa:regressions` | 0 falhas |
| `qa:pwa` (chromium) | 18/18 |
| Integração PostgreSQL local (WSL) | 13 migrações + seed; **57 verificações**, 0 falhas |
| `npm run db:test` (Docker) | não executável (Docker ausente) |
| `npm run db:e2e` (Supabase local) | não executável (exige Docker) |

O runner de integração usa o **PostgreSQL 16 instalado no WSL** (Ubuntu 24.04),
em bancos descartáveis recriados a cada execução, com o shim de auth
(`auth.uid()`/papéis). Novos testes: `meal_plan_reorder.sql` (9 verificações) e o
caso de reenvio de itens manuais em `shoppingListItems` (unitário).

## Validação via Browser MCP (fixtures locais)

- **Reordenação com 3 refeições do mesmo tipo** (o caso que quebrava): troca
  concluída, posições 0/1/2 sem colisão, status "agora vem antes de…", refletido
  no dia e na lista compacta.
- **Despensa com item manual presente:** "Adicionar faltantes à lista" concluiu
  sem erro, o item manual sobreviveu e o ingrediente do catálogo foi somado
  (Abacate 6→8).
- **Favoritos:** favoritar → persistiu → filtro "Favoritas" (1 de 72).
- **Revisão do catálogo:** indicador no catálogo (72/72) e no detalhe.
- **PDF da lista:** inclui o item manual e o item de catálogo.
- Console: 0 erros em todos os passos.

## Limitações e ações futuras

- **Sem stack Supabase local (Auth + PostgREST):** Docker não está disponível
  neste ambiente, então a integração real pelo PostgREST e o `db:e2e` não
  rodaram. O que foi validado: SQL direto + shim de auth no PostgreSQL local, e
  o backend simulado do QA. A stack completa (GoTrue/PostgREST) segue pendente.
- **Migrações pendentes** de aplicação no Supabase de produção (4, listadas
  acima). A leitura tolerante mantém o app funcionando até lá.
- **Revisão do catálogo** por nutricionista/pediatra continua pendente
  (`docs/catalogo-revisao-profissional.md`).
