# Catálogo — pendências de revisão profissional

Este documento registra, de forma separada, o conteúdo do catálogo que ainda
depende de revisão por nutricionista ou pediatra. Ele **não** afirma que as
receitas foram aprovadas e **não** substitui orientação individual.

## Contexto

- O catálogo tem **72 receitas** (24 em `supabase/seed.sql` + 48 em
  `supabase/migrations/20260826013000_expand_recipe_catalog.sql`), distribuídas
  em 18 cafés da manhã, 18 almoços, 18 lanches e 18 jantares.
- Todas as receitas têm ingredientes, quantidades, modo de preparo, notas de
  conservação e substituições. Não há registros vazios ou placeholders no meio.
- Todas as 72 estão marcadas com `is_demo = true`, que neste projeto significa
  **conteúdo editorial ainda não revisado por profissional**, e não "protótipo
  incompleto". A apresentação ao usuário é governada por `is_active`.
- A coluna `content_review_status` (migration
  `20261010000000_add_recipe_review_status.sql`) registra a pendência de
  revisão sem alterar publicação.

## O que precisa de revisão profissional

1. **Idade mínima** por receita (intervalo atual: 6 a 9 meses).
2. **Textura e forma de oferta** por fase.
3. **Cortes seguros** (especialmente itens redondos/firmes e uvas/tomates).
4. **Alergênicos**: hoje há marcação explícita em 18 receitas (ovo, leite,
   glúten, peixe). As demais podem conter alergênicos implícitos nos
   ingredientes e precisam de conferência.
5. **Risco de engasgo** em preparos com pedaços, sementes (chia) e
   oleaginosas.

## Lista por refeição (todas pendentes de revisão)

### Café da manhã

- Abacate com banana e aveia — 6 meses
- Aveia cremosa com manga — 6 meses
- Creme de abóbora com aveia — 6 meses
- Creme de maçã com aveia — 6 meses
- Creme de mamão com banana — 6 meses
- Mamão com aveia macia — 6 meses
- Mingau de banana e aveia — 6 meses
- Quinoa cremosa com banana — 7 meses
- Batata-doce amassada com ovo — 8 meses
- Cuscuz macio com abacate — 8 meses
- Cuscuz macio com banana — 8 meses
- Cuscuz macio com ovo — 8 meses
- Omelete macia de espinafre — 8 meses
- Panquequinha de abóbora — 8 meses
- Panquequinha de banana — 8 meses
- Pera cozida com chia hidratada — 8 meses
- Quinoa cremosa com pera — 8 meses
- Pão macio com abacate — 9 meses

### Almoço

- Feijão com abóbora e arroz — 6 meses
- Frango com arroz e brócolis — 6 meses
- Frango com batata e cenoura — 6 meses
- Arroz com lentilha e abóbora — 7 meses
- Carne com mandioca e abóbora — 7 meses
- Frango com polenta e abobrinha — 7 meses
- Lentilha com arroz e beterraba — 7 meses
- Lentilha com batata-doce e couve — 7 meses
- Carne com batata e beterraba — 8 meses
- Carne com polenta e espinafre — 8 meses
- Grão-de-bico com brócolis — 8 meses
- Grão-de-bico com cenoura e quinoa — 8 meses
- Ovo com batata e brócolis — 8 meses
- Peixe com arroz e cenoura — 8 meses
- Peixe com batata-doce e abobrinha — 8 meses
- Peixe com mandioca e espinafre — 9 meses
- Peru com arroz e beterraba — 9 meses
- Peru com quinoa e brócolis — 9 meses

### Lanche

- Abacate com manga — 6 meses
- Banana com abacate — 6 meses
- Manga com banana — 6 meses
- Pera com abacate — 6 meses
- Iogurte natural com banana e aveia — 7 meses
- Maçã assada com aveia — 7 meses
- Mamão com iogurte natural — 7 meses
- Mamão com pêssego — 7 meses
- Melão com banana amassada — 7 meses
- Melão com mamão — 7 meses
- Pera com iogurte natural — 7 meses
- Pêssego cozido com aveia — 7 meses
- Pêssego cozido com banana — 7 meses
- Maçã com quinoa macia — 8 meses
- Maçã cozida com chia — 8 meses
- Manga com chia hidratada — 8 meses
- Panquequinha de pera — 8 meses
- Bolinho macio de banana e aveia — 9 meses

### Jantar

- Arroz com lentilha e cenoura — 6 meses
- Creme de abóbora com arroz — 6 meses
- Carne com abóbora e arroz — 7 meses
- Feijão com cenoura e arroz — 7 meses
- Feijão com mandioca e brócolis — 7 meses
- Frango com batata-doce e couve — 7 meses
- Frango com mandioca — 7 meses
- Sopa espessa de lentilha e batata — 7 meses
- Carne com arroz e abobrinha — 8 meses
- Creme espesso de ervilha e batata-doce — 8 meses
- Frango com quinoa e abobrinha — 8 meses
- Grão-de-bico com abóbora e arroz — 8 meses
- Omelete de espinafre com batata — 8 meses
- Omelete macia de abobrinha — 8 meses
- Sopa rústica de batata e ervilha — 8 meses
- Peixe com abóbora e quinoa — 9 meses
- Peru com polenta e cenoura — 9 meses
- Quinoa com legumes macios — 9 meses

## Comunicação ao usuário

O app exibe uma nota educativa proporcional na tela de detalhe da receita e no
rodapé, informando que o conteúdo é educativo e não substitui pediatra ou
nutricionista. Nenhuma alegação de aprovação profissional é feita.
