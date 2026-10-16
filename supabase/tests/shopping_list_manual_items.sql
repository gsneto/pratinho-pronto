-- Testes de integração REAIS dos itens manuais da lista de compras.
-- Roda contra PostgreSQL local (container descartável) com o shim de auth.
-- Não é produção. Reproduz auth.uid()/papéis como o Supabase faz.
\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------- helpers
create or replace function pg_temp.assert_true(label text, cond boolean)
returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL %', label; end if;
  raise notice 'PASS  %', label;
end $$;

create or replace function pg_temp.expect_error(label text, stmt text, expect_fragment text)
returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if position(expect_fragment in sqlerrm) = 0 then
      raise exception 'FAIL %: esperava erro com "%", veio "%"', label, expect_fragment, sqlerrm;
    end if;
    raise notice 'PASS  % (erro esperado: %)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL %: esperava erro com "%" mas a instrução teve sucesso', label, expect_fragment;
end $$;

-- ---------------------------------------------------------------- dados base
insert into public.access_grants (email, provider) values
  ('m@test', 'test'),
  ('n@test', 'test');

insert into auth.users (id, email) values
  ('e0000000-0000-0000-0000-00000000000a', 'm@test'),
  ('e0000000-0000-0000-0000-00000000000b', 'n@test');

insert into public.babies (id, user_id, name, birth_date) values
  ('e1111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-00000000000a', 'Mia', '2025-12-01'),
  ('e1111111-1111-1111-1111-111111111112', 'e0000000-0000-0000-0000-00000000000b', 'Nia', '2025-12-01');

insert into public.ingredients (id, name, category) values
  ('e2222222-2222-2222-2222-222222222221', 'Ingrediente Manual Banana', 'fruit'),
  ('e2222222-2222-2222-2222-222222222222', 'Ingrediente Manual Aveia',  'grain');

insert into public.meal_plans (id, user_id, baby_id, week_start) values
  ('e3333333-3333-3333-3333-33333333333a', 'e0000000-0000-0000-0000-00000000000a', 'e1111111-1111-1111-1111-111111111111', '2026-09-14'),
  ('e3333333-3333-3333-3333-33333333333b', 'e0000000-0000-0000-0000-00000000000b', 'e1111111-1111-1111-1111-111111111112', '2026-09-14');

-- ================================================================ Teste A
-- Item do catálogo + item manual coexistem; origem é mutuamente exclusiva.
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-00000000000a', false);
set role authenticated;

select replace_shopping_list('e3333333-3333-3333-3333-33333333333a',
  '[{"ingredient_id":"e2222222-2222-2222-2222-222222222221","quantity":2,"unit":"unidade"}]'::jsonb);

insert into public.shopping_list_items (shopping_list_id, ingredient_id, custom_name, quantity, unit)
select l.id, null, 'Fraldas', 1, 'pacote'
from public.shopping_lists l
where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a';

select pg_temp.assert_true('A: item do catálogo tem ingrediente e sem custom_name',
  exists (select 1 from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
      and i.ingredient_id = 'e2222222-2222-2222-2222-222222222221' and i.custom_name is null));

select pg_temp.assert_true('A: item manual tem custom_name e sem ingrediente',
  exists (select 1 from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
      and i.ingredient_id is null and i.custom_name = 'Fraldas' and i.quantity = 1));

-- ================================================================ Teste B
-- Editar quantidade/unidade e nome do item manual; marcar como comprado.
update public.shopping_list_items i
  set quantity = 3, unit = 'pacote grande'
from public.shopping_lists l
where l.id = i.shopping_list_id
  and l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
  and i.custom_name = 'Fraldas';

select pg_temp.assert_true('B: quantidade/unidade do item manual atualizadas',
  exists (select 1 from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
      and i.custom_name = 'Fraldas' and i.quantity = 3 and i.unit = 'pacote grande'));

update public.shopping_list_items i
  set custom_name = 'Fraldas tamanho M'
from public.shopping_lists l
where l.id = i.shopping_list_id
  and l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
  and i.custom_name = 'Fraldas';

update public.shopping_list_items i
  set checked = true
from public.shopping_lists l
where l.id = i.shopping_list_id
  and l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
  and i.custom_name = 'Fraldas tamanho M';

select pg_temp.assert_true('B: nome do item manual reescrito e marcado como comprado',
  exists (select 1 from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
      and i.custom_name = 'Fraldas tamanho M' and i.checked = true));

-- ================================================================ Teste C
-- Restrições de origem: exatamente um dos dois estados.
select pg_temp.expect_error('C: item sem origem (nem ingrediente nem nome)',
  $q$insert into public.shopping_list_items (shopping_list_id, ingredient_id, custom_name, quantity, unit)
     select l.id, null, null, 1, 'unidade'
     from public.shopping_lists l
     where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'$q$,
  'origin_check');

select pg_temp.expect_error('C: item com as duas origens ao mesmo tempo',
  $q$insert into public.shopping_list_items (shopping_list_id, ingredient_id, custom_name, quantity, unit)
     select l.id, 'e2222222-2222-2222-2222-222222222221', 'Nome livre', 1, 'unidade'
     from public.shopping_lists l
     where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'$q$,
  'origin_check');

select pg_temp.expect_error('C: item manual com nome vazio',
  $q$insert into public.shopping_list_items (shopping_list_id, ingredient_id, custom_name, quantity, unit)
     select l.id, null, '   ', 1, 'unidade'
     from public.shopping_lists l
     where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'$q$,
  'origin_check');

select pg_temp.expect_error('C: ingrediente inexistente (FK)',
  $q$insert into public.shopping_list_items (shopping_list_id, ingredient_id, custom_name, quantity, unit)
     select l.id, '99999999-9999-9999-9999-999999999999', null, 1, 'unidade'
     from public.shopping_lists l
     where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'$q$,
  'foreign key');

select pg_temp.expect_error('C: item manual duplicado (mesmo nome e unidade)',
  $q$insert into public.shopping_list_items (shopping_list_id, ingredient_id, custom_name, quantity, unit)
     select l.id, null, 'Fraldas Tamanho M', 1, 'Pacote Grande'
     from public.shopping_lists l
     where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'$q$,
  'shopping_list_items_manual_unique');

-- ================================================================ Teste D
-- Recalcular a lista substitui os itens do cardápio e PRESERVA os manuais.
select replace_shopping_list('e3333333-3333-3333-3333-33333333333a',
  '[{"ingredient_id":"e2222222-2222-2222-2222-222222222222","quantity":5,"unit":"colher de sopa"}]'::jsonb);

select pg_temp.assert_true('D: item manual preservado após recalcular',
  exists (select 1 from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
      and i.custom_name = 'Fraldas tamanho M' and i.quantity = 3 and i.checked = true));

select pg_temp.assert_true('D: item do cardápio anterior foi substituído',
  not exists (select 1 from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
      and i.ingredient_id = 'e2222222-2222-2222-2222-222222222221'));

select pg_temp.assert_true('D: novo item do cardápio entrou',
  exists (select 1 from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
      and i.ingredient_id = 'e2222222-2222-2222-2222-222222222222' and i.quantity = 5));

-- ================================================================ Teste E
-- Atomicidade: falha no meio do recálculo reverte tudo, sem tocar os manuais.
reset role;
create or replace function pg_temp.fail_on_aveia() returns trigger language plpgsql as $$
begin
  if new.ingredient_id = 'e2222222-2222-2222-2222-222222222222' then
    raise exception 'injected_failure_on_aveia';
  end if;
  return new;
end $$;
create trigger trg_fail_on_aveia before insert on public.shopping_list_items
  for each row execute function pg_temp.fail_on_aveia();

select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-00000000000a', false);
set role authenticated;

select pg_temp.expect_error('E: falha injetada aborta o recálculo',
  $q$select replace_shopping_list('e3333333-3333-3333-3333-33333333333a',
      '[{"ingredient_id":"e2222222-2222-2222-2222-222222222222","quantity":9,"unit":"unidade"}]'::jsonb)$q$,
  'injected_failure_on_aveia');

reset role;
drop trigger trg_fail_on_aveia on public.shopping_list_items;
set role authenticated;

select pg_temp.assert_true('E: rollback manteve o item do cardápio (Aveia=5)',
  exists (select 1 from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
      and i.ingredient_id = 'e2222222-2222-2222-2222-222222222222' and i.quantity = 5));

select pg_temp.assert_true('E: rollback manteve o item manual',
  exists (select 1 from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
      and i.custom_name = 'Fraldas tamanho M'));

-- ================================================================ Teste F
-- Isolamento entre usuários (RLS) para itens manuais.
reset role;
-- Captura o id da lista de A como postgres (ignora RLS) num GUC de sessão,
-- para que B possa tentar inserir com um id real conhecido.
select set_config('test.list_a',
  (select l.id::text from public.shopping_lists l
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'),
  false);
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-00000000000b', false);
set role authenticated;

select pg_temp.assert_true('F: B não lê os itens da lista de A (RLS)',
  (select count(*) from public.shopping_list_items i
     join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a') = 0);

select pg_temp.expect_error('F: B não insere item manual na lista de A (RLS)',
  $q$insert into public.shopping_list_items (shopping_list_id, ingredient_id, custom_name, quantity, unit)
     values (current_setting('test.list_a')::uuid, null, 'Invasão', 1, 'unidade')$q$,
  'row-level security');

-- ================================================================ Teste G
-- Remoção do item manual.
reset role;
select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-00000000000a', false);
set role authenticated;

delete from public.shopping_list_items i
using public.shopping_lists l
where l.id = i.shopping_list_id
  and l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
  and i.custom_name = 'Fraldas tamanho M';

select pg_temp.assert_true('G: item manual removido',
  not exists (select 1 from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'e3333333-3333-3333-3333-33333333333a'
      and i.custom_name is not null));

reset role;
select 'ALL_MANUAL_ITEM_TESTS_PASSED' as result;
rollback;
