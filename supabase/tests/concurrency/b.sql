-- Worker B: substitui por 5 itens. Deve bloquear no lock de A e, quando A
-- commitar, substituir a lista inteira pelos seus itens (sem misturar).
begin;
select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-00000000000c', false);
set local role authenticated;
select public.replace_shopping_list('c2222222-2222-2222-2222-222222222222',
  $j$[{"ingredient_id":"c3333333-3333-3333-3333-333333333001","quantity":1,"unit":"unidade"},
      {"ingredient_id":"c3333333-3333-3333-3333-333333333002","quantity":2,"unit":"colher de sopa"},
      {"ingredient_id":"c3333333-3333-3333-3333-333333333003","quantity":1,"unit":"unidade"},
      {"ingredient_id":"c3333333-3333-3333-3333-333333333004","quantity":1,"unit":"unidade"},
      {"ingredient_id":"c3333333-3333-3333-3333-333333333005","quantity":1,"unit":"unidade"}]$j$::jsonb);
commit;
