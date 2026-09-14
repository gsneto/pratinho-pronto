# Contrato de trabalho em paralelo

Checkpoint de rollback: `fb01482` (`git reset --hard fb01482`)
Estado no checkpoint: 47 testes passando, lint limpo, build OK.

## Regra única e inviolável

Cada agente escreve **apenas** nos arquivos da sua coluna. Se precisar de algo
fora dela, **não edite**: relate no resultado final e o integrador resolve.

## Agente A — Visual e apresentação

Dono exclusivo de:
- `src/index.css` (tokens, tema escuro)
- `DESIGN.md` (criar)
- `src/preview/**` (área de prévia isolada, criar)
- `src/components/**` (todos, inclusive `pdf/documents.tsx`)
- JSX e classes dentro de `src/pages/**`
- `public/images/recipes/**` (normalização de proporção)
- `entregaveis/**` (capturas)

Proibido: `src/services/**`, `src/hooks/**`, `src/lib/**`, `src/utils/**`,
`supabase/**`, `api/**`, `src/landing/**`, `package.json`, `vite.config.ts`.

## Agente B — Produto, dados e camada abaixo

Dono exclusivo de:
- `src/services/**`
- `src/hooks/**`
- `src/lib/**` (exceto nada — todo)
- `src/utils/**` e respectivos `*.test.ts`
- `supabase/migrations/**` (novas migrations apenas)
- `public/sw.js`

Proibido: `src/components/**`, `src/pages/**`, `src/index.css`, `DESIGN.md`,
`src/preview/**`, `src/landing/**`, `api/cakto-webhook.ts`, `package.json`.

## Fronteira de contrato

`src/utils/**` e `src/lib/**` pertencem a B, mas A **consome** essas funções.
B pode adicionar funções livremente. B **não pode** alterar assinatura, nome
ou retorno de função pública já existente sem declarar isso no relatório.
Funções em uso hoje por A: `splitInstructions`, `publicRecipeText`,
`normalizeWeekStart`, `compareMealTypes`, `compareIngredientCategories`,
`formatShortDate`, `addDays`, `getWeekStart`, `mealTypeLabels`,
`ingredientCategoryLabels`, `weekDayLabels`, `getRecipeImageUrl`.

## Recursos exclusivos do integrador

- Navegador / Playwright MCP (perfil único, não paralelizável)
- `npm run preview` e portas de rede
- `npm run test`, `lint`, `build` como validação final
- Qualquer commit ou operação git

Agentes **não** devem abrir navegador, subir servidor nem commitar.

## Proibições para ambos

Preço, checkout, webhook, campanhas, Pixel, landing page, regras de acesso,
deploy, push, migração em produção, novas dependências.
