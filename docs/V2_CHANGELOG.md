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
