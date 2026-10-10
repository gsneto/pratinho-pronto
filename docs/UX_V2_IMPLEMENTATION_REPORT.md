# Relatório de execução — V1.2 (execução noturna)

Branch: `feat/pratinho-ux-polish-20261009`. Base preservada:
`design/maternal-ui-refresh` @ `c38ffd8`. Sem deploy, sem merge, sem produção.

## Ciclo 1 — Integridade da lista de compras

- **Problema:** `appendShoppingListItems` fazia `upsert` com
  `ignoreDuplicates:false`, **sobrescrevendo** a quantidade já existente.
  Adicionar um ingrediente faltante pela despensa reduzia o total do cardápio.
- **Evidência:** "Banana 3 unidades" virava "1 unidade" ao adicionar "Banana com
  abacate" (que precisa de 1 banana).
- **Correção:** novo `mergeShoppingListItems` (soma por ingrediente+unidade,
  sem converter unidades) e leitura dos itens existentes antes do upsert.
- **Verificação:** no QA, Banana passou de **3 → 4 unidades** (soma), não 1.
- **Arquivos:** `src/lib/shopping-list/merge.ts` (+ teste),
  `src/services/shoppingLists.ts` (+ testes).
- **Commit:** `66027e4`.

## Ciclo 2 — Acessibilidade da landing (não coberta antes)

- **Problema:** auditoria axe na landing (`/`) — não incluída no QA — apontou:
  contraste insuficiente nos CTAs (branco sobre terracota claro = 2.28:1) e em
  textos de apoio; `landmark-unique` nas respostas do FAQ sem nome acessível;
  `scrollable-region-focusable` nos carrosséis.
- **Correção:** `--lp-cta` acessível (branco passa ~5.4:1) aplicado a todos os
  CTAs; cores de apoio corrigidas; contraste dark-on-dark dos depoimentos
  corrigido; cada resposta do FAQ recebeu `aria-labelledby`; carrosséis com
  `tabIndex=0`.
- **Verificação:** axe = **0 violações** em 390 e 1440 px.
- **Arquivos:** `src/landing/landing.css`, `src/landing/LandingPage.tsx`.
- **Commit:** `cdbadc9`.

## Ciclo 3 — Integridade do catálogo

- **Verificação:** 72 receitas completas (≥2 ingredientes, instruções, servir,
  conservação, substituições), alergênicos coerentes, fotos mapeadas sem órfãos.
- **Correção:** teste de integridade nomes ↔ fotos ↔ arquivos.
- **Arquivos:** `src/lib/recipes/catalog-integrity.test.ts`, `docs/CONTENT_CATALOG_AUDIT.md`.
- **Commits:** `f983634`, `9e22892`.

## Ciclo 4/12 — Capturas e inspeção

- Capturas em `entregaveis/capturas/night-run/` (390 px e 320 px), incluindo
  modal de troca, PDFs renderizados e a landing. Revisão por OCR local (não é
  visão computacional de pixels); sem inspeção por visão de IA.

## Ciclo 5 — PDFs

- Cardápio (1 pág.), lista (3 págs.), receitas (8 págs.), A4, sem páginas
  vazias; quantidades e notas corretas. Sem defeitos a corrigir.

## Ciclo 7 — Performance/PWA

- Chunk do PDF (~1,2 MB) é carregado sob demanda (`await import`). Service
  worker com cache versionado e network-first na navegação. Console sem erros.

## Validação final

| Suíte | Resultado |
|---|---|
| `npm test` | 155/155 |
| `npm run lint` | limpo |
| `npm run build` | OK |
| `qa:flows` (chromium/firefox/webkit) | 24/24 em cada |
| `qa:audit` (chromium) | 54/54, 0 violações axe |
| `qa:dialogs` (chromium) | 12/12 |
| Responsividade 320–1440 | 0 overflow |
| Alvos de toque | ≥ 40 px |

## Dependências externas / limitações

- Persistência, RLS e pagamento dependem do Supabase/Cakto de produção; não
  exercitados (sem credenciais). Não simulados como confirmados.
- Revisão de conteúdo por nutricionista/pediatra permanece pendente.
