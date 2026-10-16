-- Setup do teste de concorrência: usuário, cardápio e lista inicial.
insert into public.access_grants (email, provider) values ('c@test', 'test');
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-00000000000c', 'c@test');
insert into public.babies (id, user_id, name, birth_date)
  values ('c1111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-00000000000c', 'Caio', '2025-12-01');
insert into public.meal_plans (id, user_id, baby_id, week_start)
  values ('c2222222-2222-2222-2222-222222222222', 'c0000000-0000-0000-0000-00000000000c', 'c1111111-1111-1111-1111-111111111111', '2026-09-14');
insert into public.ingredients (id, name, category) values
  ('c3333333-3333-3333-3333-333333333001', 'Ing Concorrencia 1', 'fruit'),
  ('c3333333-3333-3333-3333-333333333002', 'Ing Concorrencia 2', 'grain'),
  ('c3333333-3333-3333-3333-333333333003', 'Ing Concorrencia 3', 'protein'),
  ('c3333333-3333-3333-3333-333333333004', 'Ing Concorrencia 4', 'vegetable'),
  ('c3333333-3333-3333-3333-333333333005', 'Ing Concorrencia 5', 'dairy');

select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-00000000000c', false);
set role authenticated;
select public.replace_shopping_list('c2222222-2222-2222-2222-222222222222',
  $j$[{"ingredient_id":"c3333333-3333-3333-3333-333333333001","quantity":1,"unit":"unidade"}]$j$::jsonb);
reset role;
