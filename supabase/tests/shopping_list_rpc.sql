-- Testes de integração REAIS da RPC replace_shopping_list e das políticas RLS.
-- Roda contra PostgreSQL local (container descartável) com o shim de auth.
-- Não é produção. Cada chamada usa SET ROLE + request.jwt.claim.sub para
-- reproduzir auth.uid() e o papel SQL como o Supabase faz.
\set ON_ERROR_STOP on

-- Tudo roda em uma transação e é revertido no fim: o banco fica limpo e o
-- script pode ser executado repetidamente. (A falha injetada é capturada por
-- handlers plpgsql, então não aborta a transação externa.)
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
-- A migração de access_grants adiciona um gatilho em auth.users que só permite
-- criar usuário se o e-mail tiver uma compra aprovada. Simulamos a compra antes.
insert into public.access_grants (email, provider) values
  ('a@test', 'test'),
  ('b@test', 'test');

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-00000000000a', 'a@test'),
  ('b0000000-0000-0000-0000-00000000000b', 'b@test');

insert into public.babies (id, user_id, name, birth_date) values
  ('a1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 'Alice', '2025-12-01'),
  ('b1111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b', 'Bia',   '2025-12-01');

-- Ingredientes exclusivos do teste (nomes próprios para não colidir com o
-- catálogo real, que já existe após migrações + seed).
insert into public.ingredients (id, name, category) values
  ('c0000000-0000-0000-0000-000000000001', 'Ingrediente Teste Banana', 'fruit'),
  ('c0000000-0000-0000-0000-000000000002', 'Ingrediente Teste Aveia',  'grain'),
  ('c0000000-0000-0000-0000-000000000003', 'Ingrediente Teste Ovo',    'protein');

insert into public.meal_plans (id, user_id, baby_id, week_start) values
  ('d0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-00000000000a', 'a1111111-1111-1111-1111-111111111111', '2026-09-14'),
  ('d0000000-0000-0000-0000-00000000000b', 'b0000000-0000-0000-0000-00000000000b', 'b1111111-1111-1111-1111-111111111111', '2026-09-14');

-- ================================================================ Teste A
-- Atualização bem-sucedida pelo dono.
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', false);
set role authenticated;

select pg_temp.assert_true('A: auth.uid() é o usuário A',
  auth.uid() = 'a0000000-0000-0000-0000-00000000000a');

select pg_temp.assert_true('A: retorno é o id da lista',
  replace_shopping_list('d0000000-0000-0000-0000-00000000000a',
    '[{"ingredient_id":"c0000000-0000-0000-0000-000000000001","quantity":2,"unit":"unidade"},
      {"ingredient_id":"c0000000-0000-0000-0000-000000000002","quantity":1.5,"unit":"colher de sopa"}]'::jsonb)
  is not null);

select pg_temp.assert_true('A: 2 itens persistidos',
  (select count(*) from public.shopping_list_items i
     join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'd0000000-0000-0000-0000-00000000000a') = 2);

select pg_temp.assert_true('A: quantidade fracionária preservada',
  exists (select 1 from public.shopping_list_items i
     join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'd0000000-0000-0000-0000-00000000000a'
      and i.ingredient_id = 'c0000000-0000-0000-0000-000000000002'
      and i.quantity = 1.5 and i.unit = 'colher de sopa'));

-- Repetição (idempotência): substituir de novo pelos mesmos itens não duplica.
select replace_shopping_list('d0000000-0000-0000-0000-00000000000a',
  '[{"ingredient_id":"c0000000-0000-0000-0000-000000000001","quantity":2,"unit":"unidade"},
    {"ingredient_id":"c0000000-0000-0000-0000-000000000002","quantity":1.5,"unit":"colher de sopa"}]'::jsonb);
select pg_temp.assert_true('A: repetir não duplica (ainda 2 itens)',
  (select count(*) from public.shopping_list_items i
     join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'd0000000-0000-0000-0000-00000000000a') = 2);

-- ================================================================ Teste B
-- Atomicidade: falha no meio (após o delete) deve reverter tudo.
-- Injetamos uma falha de insert só para o ingrediente "Ovo" (mecanismo de
-- teste restrito a este banco descartável; removido em seguida).
-- O gatilho é criado pelo dono da tabela (postgres), não por authenticated.
reset role;
create or replace function pg_temp.fail_on_ovo() returns trigger language plpgsql as $$
begin
  if new.ingredient_id = 'c0000000-0000-0000-0000-000000000003' then
    raise exception 'injected_failure_on_ovo';
  end if;
  return new;
end $$;
create trigger trg_fail_on_ovo before insert on public.shopping_list_items
  for each row execute function pg_temp.fail_on_ovo();

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', false);
set role authenticated;

select pg_temp.expect_error('B: falha injetada aborta a substituição',
  $q$select replace_shopping_list('d0000000-0000-0000-0000-00000000000a',
      '[{"ingredient_id":"c0000000-0000-0000-0000-000000000001","quantity":9,"unit":"unidade"},
        {"ingredient_id":"c0000000-0000-0000-0000-000000000003","quantity":1,"unit":"unidade"}]'::jsonb)$q$,
  'injected_failure_on_ovo');

reset role;
drop trigger trg_fail_on_ovo on public.shopping_list_items;
set role authenticated;

select pg_temp.assert_true('B: rollback manteve a lista anterior (2 itens)',
  (select count(*) from public.shopping_list_items i
     join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'd0000000-0000-0000-0000-00000000000a') = 2);
select pg_temp.assert_true('B: rollback preservou as quantidades originais (Banana=2)',
  exists (select 1 from public.shopping_list_items i
     join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'd0000000-0000-0000-0000-00000000000a'
      and i.ingredient_id = 'c0000000-0000-0000-0000-000000000001' and i.quantity = 2));

-- ================================================================ Teste C
-- Isolamento entre usuários.
reset role;
select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-00000000000b', false);
set role authenticated;

select pg_temp.assert_true('C: B atualiza a própria lista',
  replace_shopping_list('d0000000-0000-0000-0000-00000000000b',
    '[{"ingredient_id":"c0000000-0000-0000-0000-000000000003","quantity":1,"unit":"unidade"}]'::jsonb) is not null);

select pg_temp.expect_error('C: B não substitui a lista de A',
  $q$select replace_shopping_list('d0000000-0000-0000-0000-00000000000a',
      '[{"ingredient_id":"c0000000-0000-0000-0000-000000000003","quantity":1,"unit":"unidade"}]'::jsonb)$q$,
  'meal_plan_not_found');

select pg_temp.assert_true('C: B não lê itens da lista de A (RLS)',
  (select count(*) from public.shopping_list_items i
     join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'd0000000-0000-0000-0000-00000000000a') = 0);

select pg_temp.assert_true('C: B não lê a lista de A (RLS)',
  (select count(*) from public.shopping_lists
    where meal_plan_id = 'd0000000-0000-0000-0000-00000000000a') = 0);

-- Sem autenticação (papel authenticated, mas sem sub) -> not_authenticated.
reset role;
select set_config('request.jwt.claim.sub', '', false);
set role authenticated;
select pg_temp.expect_error('C: sem auth.uid() -> not_authenticated',
  $q$select replace_shopping_list('d0000000-0000-0000-0000-00000000000a','[]'::jsonb)$q$,
  'not_authenticated');

-- Papel anon não tem permissão de executar a RPC.
reset role;
set role anon;
select pg_temp.expect_error('C: anon não executa a RPC (permissão)',
  $q$select replace_shopping_list('d0000000-0000-0000-0000-00000000000a','[]'::jsonb)$q$,
  'permission denied');

-- ================================================================ Teste D
reset role;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-00000000000a', false);
set role authenticated;

-- Lista vazia limpa os itens.
select replace_shopping_list('d0000000-0000-0000-0000-00000000000a', '[]'::jsonb);
select pg_temp.assert_true('D: lista vazia limpa os itens',
  (select count(*) from public.shopping_list_items i
     join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'd0000000-0000-0000-0000-00000000000a') = 0);

-- Cardápio inexistente.
select pg_temp.expect_error('D: cardápio inexistente',
  $q$select replace_shopping_list('00000000-0000-0000-0000-000000000000','[]'::jsonb)$q$,
  'meal_plan_not_found');

-- Ingrediente inválido (FK) -> erro e rollback (lista continua vazia).
select pg_temp.expect_error('D: ingrediente inexistente (FK)',
  $q$select replace_shopping_list('d0000000-0000-0000-0000-00000000000a',
      '[{"ingredient_id":"99999999-9999-9999-9999-999999999999","quantity":1,"unit":"unidade"}]'::jsonb)$q$,
  'foreign key');
select pg_temp.assert_true('D: rollback após FK inválida',
  (select count(*) from public.shopping_list_items i
     join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = 'd0000000-0000-0000-0000-00000000000a') = 0);

-- Quantidade inválida (<= 0) -> check constraint.
select pg_temp.expect_error('D: quantidade inválida (0)',
  $q$select replace_shopping_list('d0000000-0000-0000-0000-00000000000a',
      '[{"ingredient_id":"c0000000-0000-0000-0000-000000000001","quantity":0,"unit":"unidade"}]'::jsonb)$q$,
  'quantity');

-- Payload malformado (não é array) -> erro.
select pg_temp.expect_error('D: payload malformado',
  $q$select replace_shopping_list('d0000000-0000-0000-0000-00000000000a','{"x":1}'::jsonb)$q$,
  '');

reset role;
select 'ALL_INTEGRATION_TESTS_PASSED' as result;
rollback;
