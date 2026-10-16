# V1.4 — Auditoria funcional com Browser MCP

Execução usando o servidor MCP `browser` (Playwright) contra o ambiente local de
fixtures (`http://127.0.0.1:4178`). Inspeção pela árvore de acessibilidade
(snapshot + `find`), não por capturas de tela.

## Método

Cada achado seguiu: hipótese → reprodução no navegador → inspeção do código →
correção → teste de regressão → validação no navegador.

## Defeitos reproduzidos e corrigidos

### 1. Busca de receitas sensível a acento (corrigido)

- **Estado inicial:** buscar "maca" na aba Receitas retornava "0 de 72".
- **Passos:** `/app/recipes?q=maca`.
- **Esperado:** encontrar as receitas com "Maçã".
- **Observado:** 0 resultados, embora existam 4 receitas com "Maçã".
- **Causa:** `filterRecipes` (`src/services/recipes.ts`) comparava com
  `toLocaleLowerCase`, mantendo acentos. A despensa já normalizava acentos
  (`normalizeTerm`), então a busca era inconsistente entre telas.
- **Correção:** `filterRecipes` usa `normalizeTerm` na consulta e no texto.
- **Teste:** `src/services/recipes.test.ts` (maca/maçã/MAÇÃ/almoco).
- **Evidência:** "maca" passou a retornar **4 de 72** no navegador.

### 2. Favoritos offline desapareciam quando o banco voltava (corrigido)

- **Causa:** `listFavoriteRecipeIds` retornava apenas os favoritos do servidor
  quando a leitura dava certo; o fallback local só era usado em erro. Um
  favorito gravado offline (fallback local) sumia quando o banco voltava.
- **Correção:** a leitura une servidor + local (sem duplicar).
- **Teste:** `src/services/favorites.test.ts` (novo; 6 casos).

## Fluxos verificados (sem defeito)

| Fluxo | Resultado |
|---|---|
| Home: ações principais | OK |
| Semana: dias, refeições, mapa, histórico | OK |
| Troca de refeição (modal → escolher → status → cardápio) | OK |
| Trocar 2 refeições em sequência | OK |
| Duplicar semana ("Repetir na próxima semana") | OK (status + navegação) |
| Adicionar receita à semana como "opção extra" | OK (dia passa a 5 refeições) |
| Favoritar/desfavoritar + filtro Favoritas | OK |
| Favorito sincroniza entre detalhe e catálogo | OK |
| Favorito persiste após recarregar | OK |
| Despensa: selecionar → resultados ("Falta comprar") | OK |
| Lista de compras: categorias, quantidades, progresso | OK |
| Item marcado persiste após recarregar | OK |
| Perfil: salvar alergênico (`known_allergens: ["ovo"]`) | OK |
| Restrições aplicadas na geração (0 receitas com ovo) | OK |
| Onboarding: redireciono sem bebê; validação de nome/data | OK |
| Semana inválida (`?week=2026-99-99`) normalizada | OK |
| PDFs: cardápio 1 pág., lista 2 págs., receitas 8 págs. | OK |
| Console: 0 erros em todos os passos | OK |
| Responsivo 320–1440: 0 overflow | OK |

## Limitações conhecidas (documentadas, não alteradas)

- **Restrições semânticas:** `isRecipeCompatible` casa termos por
  ingrediente/alergênico. Restrições livres como "vegetariano" não excluem
  carne automaticamente (não há mapeamento). Não foi criado mapeamento para não
  inventar regras clínicas.
- **Atualizar lista de compras:** "Atualizar com o cardápio" regenera a lista e
  zera as marcações de compra. É intencional (recalcular do cardápio), mas não
  há confirmação quando há itens marcados.
- **`generateShoppingList`:** apaga e reinsere itens em duas chamadas (sem
  transação). Uma falha entre elas deixaria a lista vazia. Mitigação exigiria
  uma função RPC no banco (fora do escopo local).
- **Opção extra:** uma segunda refeição do mesmo tipo no dia aparece na tela e
  nos "receitas em PDF", mas o "cardápio em PDF" mostra só a primeira do tipo
  (`items.find`).
- **Persistência real:** as fixtures são em memória e **não** comprovam o
  Supabase de produção (RLS, concorrência, sessão expirada).
