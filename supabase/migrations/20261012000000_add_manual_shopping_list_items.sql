-- Itens manuais na lista de compras (origem livre).
--
-- Antes, `shopping_list_items.ingredient_id` era NOT NULL e não havia onde
-- guardar um nome escrito pela pessoa: só existiam itens derivados do catálogo.
-- Esta migração permite que um item tenha DUAS origens mutuamente exclusivas:
--
--   1. Catálogo: `ingredient_id` preenchido e `custom_name` nulo.
--   2. Manual:   `ingredient_id` nulo e `custom_name` preenchido (nome livre).
--
-- Um CHECK garante exatamente um dos dois estados: não há item sem origem nem
-- item que seja as duas coisas ao mesmo tempo. A mudança é ADITIVA e não altera
-- nenhum registro existente — todos já têm ingrediente e permanecem válidos.

alter table public.shopping_list_items
  alter column ingredient_id drop not null;

alter table public.shopping_list_items
  add column if not exists custom_name text;

alter table public.shopping_list_items
  drop constraint if exists shopping_list_items_origin_check;

alter table public.shopping_list_items
  add constraint shopping_list_items_origin_check check (
    (ingredient_id is not null and custom_name is null)
    or (
      ingredient_id is null
      and custom_name is not null
      and char_length(btrim(custom_name)) between 1 and 80
    )
  );

comment on column public.shopping_list_items.custom_name is
  'Rótulo de um item manual (sem ingrediente do catálogo). Nulo em itens do catálogo.';

comment on constraint shopping_list_items_origin_check on public.shopping_list_items is
  'Cada item tem exatamente uma origem: ingrediente do catálogo ou nome manual.';

-- Itens manuais não têm chave natural no catálogo, então a unicidade
-- (shopping_list_id, ingredient_id, unit) não os cobre (em SQL, NULL não é igual
-- a NULL). Este índice parcial evita duplicatas exatas de itens manuais com o
-- mesmo nome e unidade, espelhando o merge feito no aplicativo.
create unique index if not exists shopping_list_items_manual_unique
  on public.shopping_list_items (
    shopping_list_id,
    lower(btrim(custom_name)),
    lower(btrim(unit))
  )
  where ingredient_id is null;
