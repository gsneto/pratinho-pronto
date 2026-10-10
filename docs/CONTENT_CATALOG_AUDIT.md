# Catálogo de receitas — auditoria de integridade

Data: execução noturna V1.2. Fonte: `supabase/seed.sql` (24) +
`supabase/migrations/20260826013000_expand_recipe_catalog.sql` (48).

## Resultado

| Verificação | Resultado |
|---|---|
| Total de receitas | 72 (48 + 24) |
| Nomes únicos | 72 |
| Cada receita tem ≥ 2 ingredientes | sim (mínimo observado: 2) |
| Instruções de preparo presentes | sim, todas |
| Notas de "como servir" | sim, todas |
| Notas de conservação | sim, todas |
| Substituições | sim, todas |
| Idade mínima dentro da faixa 6–9 meses | sim |
| Tempo de preparo > 0 | sim |
| Quantidades e unidades válidas | sim |
| Foto mapeada por receita (`src/lib/recipes/images.ts`) | 72/72 |
| Arquivos de imagem existentes em `public/images/recipes/` | 72/72, sem órfãos |
| Alergênicos coerentes com os ingredientes | sim (ovo, leite, glúten, peixe) |
| Alergênico presente sem marcação | nenhum |

Essas invariantes são verificadas automaticamente por
`src/lib/recipes/catalog-integrity.test.ts` (nomes ↔ fotos ↔ arquivos) e pelo
QA de fixtures, que carrega o SQL real.

## Semântica de `is_demo` e `content_review_status`

- `is_demo` marca o conteúdo editorial que **ainda não passou por revisão
  profissional**. Não significa "protótipo incompleto": as receitas têm
  ingredientes, quantidades, preparo e notas completos.
- A apresentação ao usuário é governada por `is_active`. O selo "Demonstrativa"
  só aparece no modo de QA (`VITE_DEMO_MODE=true`); na publicação ele não é
  repetido.
- `content_review_status` (migration aditiva
  `20261010000000_add_recipe_review_status.sql`) registra a pendência de
  revisão sem alterar publicação.

## Pendências que exigem profissional qualificado

Revisão de idade mínima, textura, cortes seguros e alergênicos por
nutricionista/pediatra. A lista completa está em
[`catalogo-revisao-profissional.md`](./catalogo-revisao-profissional.md). O app
não afirma aprovação profissional em nenhum ponto.
