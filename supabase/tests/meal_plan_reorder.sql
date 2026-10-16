-- Testes de integração REAIS da RPC swap_meal_plan_item_positions.
-- Roda contra PostgreSQL local (descartável) com o shim de auth. Não é produção.
\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.assert_true(label text, cond boolean)
returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL %', label; end if;
  raise notice 'PASS  %', label;
end $$;

create or replace function pg_temp.expect_error(label text, stmt text, fragment text)
returns void language plpgsql as $$
begin
  begin execute stmt;
  exception when others then
    if position(fragment in sqlerrm) = 0 then raise exception 'FAIL %: esperava "%", veio "%"', label, fragment, sqlerrm; end if;
    raise notice 'PASS  % (%)', label, sqlerrm; return;
  end;
  raise exception 'FAIL %: esperava erro "%" mas passou', label, fragment;
end $$;

-- ---------------------------------------------------------------- dados base
insert into public.access_grants (email, provider) values
  ('s@test','test'), ('t@test','test');
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-00000000005a','s@test'),
  ('a0000000-0000-0000-0000-00000000005b','t@test');
insert into public.babies (id, user_id, name, birth_date) values
  ('a1111111-1111-1111-1111-11111111115a','a0000000-0000-0000-0000-00000000005a','Sofia','2025-12-01'),
  ('a1111111-1111-1111-1111-11111111115b','a0000000-0000-0000-0000-00000000005b','Tina','2025-12-01');
insert into public.recipes (id, name, description, min_age_months, meal_type, prep_time_minutes, instructions) values
  ('b0000000-0000-0000-0000-00000000005a','Receita Swap','x',6,'breakfast',5,'passo');
insert into public.meal_plans (id, user_id, baby_id, week_start) values
  ('d0000000-0000-0000-0000-00000000005a','a0000000-0000-0000-0000-00000000005a','a1111111-1111-1111-1111-11111111115a','2026-09-14'),
  ('d0000000-0000-0000-0000-00000000005b','a0000000-0000-0000-0000-00000000005b','a1111111-1111-1111-1111-11111111115b','2026-09-14');
insert into public.meal_plan_items (id, meal_plan_id, recipe_id, date, meal_type, position) values
  ('e0000000-0000-0000-0000-0000000000a1','d0000000-0000-0000-0000-00000000005a','b0000000-0000-0000-0000-00000000005a','2026-09-14','breakfast',0),
  ('e0000000-0000-0000-0000-0000000000a2','d0000000-0000-0000-0000-00000000005a','b0000000-0000-0000-0000-00000000005a','2026-09-14','breakfast',1),
  ('e0000000-0000-0000-0000-0000000000a3','d0000000-0000-0000-0000-00000000005a','b0000000-0000-0000-0000-00000000005a','2026-09-14','breakfast',2),
  ('e0000000-0000-0000-0000-0000000000a4','d0000000-0000-0000-0000-00000000005a','b0000000-0000-0000-0000-00000000005a','2026-09-14','lunch',0),
  ('e0000000-0000-0000-0000-0000000000b1','d0000000-0000-0000-0000-00000000005b','b0000000-0000-0000-0000-00000000005a','2026-09-14','breakfast',0);

-- ================================================================ Teste A
-- Troca com TRÊS refeições do mesmo tipo: a versão antiga (temp = max+1 no
-- cliente) colidia com a terceira; a RPC usa uma posição livre e conclui.
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000005a', false);
set role authenticated;

select swap_meal_plan_item_positions('e0000000-0000-0000-0000-0000000000a1','e0000000-0000-0000-0000-0000000000a2');

select pg_temp.assert_true('A: 3 refeições — troca de 0 e 1 resultou em 1,0,2',
  (select array_agg(position order by id) from public.meal_plan_items
    where meal_plan_id = 'd0000000-0000-0000-0000-00000000005a' and meal_type = 'breakfast') = array[1,0,2]);

select pg_temp.assert_true('A: nenhum item perdido nem duplicado',
  (select count(*) from public.meal_plan_items where meal_plan_id = 'd0000000-0000-0000-0000-00000000005a') = 4);

-- Troca de novo (1 e 2) para confirmar que a posição temporária não deixa rastro.
select swap_meal_plan_item_positions('e0000000-0000-0000-0000-0000000000a2','e0000000-0000-0000-0000-0000000000a3');
select pg_temp.assert_true('A: segunda troca resultou em 1,2,0',
  (select array_agg(position order by id) from public.meal_plan_items
    where meal_plan_id = 'd0000000-0000-0000-0000-00000000005a' and meal_type = 'breakfast') = array[1,2,0]);

-- ================================================================ Teste B
-- Validações: mesmo slot, posse e identidade.
select pg_temp.expect_error('B: itens de tipos diferentes são recusados',
  $q$select swap_meal_plan_item_positions('e0000000-0000-0000-0000-0000000000a1','e0000000-0000-0000-0000-0000000000a4')$q$,
  'items_not_in_same_slot');

select pg_temp.expect_error('B: item inexistente é recusado',
  $q$select swap_meal_plan_item_positions('e0000000-0000-0000-0000-0000000000a1','99999999-9999-9999-9999-999999999999')$q$,
  'meal_plan_item_not_found');

select pg_temp.expect_error('B: item de outro usuário é recusado',
  $q$select swap_meal_plan_item_positions('e0000000-0000-0000-0000-0000000000a1','e0000000-0000-0000-0000-0000000000b1')$q$,
  'meal_plan_item_not_found');

-- Trocar consigo mesmo é um no-op silencioso (não corrompe).
select swap_meal_plan_item_positions('e0000000-0000-0000-0000-0000000000a1','e0000000-0000-0000-0000-0000000000a1');
select pg_temp.assert_true('B: trocar consigo mesmo não altera nada',
  (select array_agg(position order by id) from public.meal_plan_items
    where meal_plan_id = 'd0000000-0000-0000-0000-00000000005a' and meal_type = 'breakfast') = array[1,2,0]);

-- ================================================================ Teste C
-- anon não executa; authenticated sem sub também não.
reset role;
set role anon;
select pg_temp.expect_error('C: anon não executa a RPC',
  $q$select swap_meal_plan_item_positions('e0000000-0000-0000-0000-0000000000a1','e0000000-0000-0000-0000-0000000000a2')$q$,
  'permission denied');

reset role;
select set_config('request.jwt.claim.sub', '', false);
set role authenticated;
select pg_temp.expect_error('C: sem auth.uid() -> not_authenticated',
  $q$select swap_meal_plan_item_positions('e0000000-0000-0000-0000-0000000000a1','e0000000-0000-0000-0000-0000000000a2')$q$,
  'not_authenticated');

reset role;
select 'ALL_REORDER_TESTS_PASSED' as result;
rollback;
