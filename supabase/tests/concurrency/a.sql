-- Worker A: pega o lock da linha da lista, espera, e substitui por 3 itens.
begin;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-00000000000c', false);
set local role authenticated;
select id from public.shopping_lists
  where meal_plan_id = 'c2222222-2222-2222-2222-222222222222' for update;
select pg_sleep(1);
select public.replace_shopping_list('c2222222-2222-2222-2222-222222222222',
  $j$[{"ingredient_id":"c3333333-3333-3333-3333-333333333001","quantity":1,"unit":"unidade"},
      {"ingredient_id":"c3333333-3333-3333-3333-333333333002","quantity":2,"unit":"colher de sopa"},
      {"ingredient_id":"c3333333-3333-3333-3333-333333333003","quantity":1,"unit":"unidade"}]$j$::jsonb);
commit;
