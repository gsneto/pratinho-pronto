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
