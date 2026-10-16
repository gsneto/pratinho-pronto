-- Verificação: a lista final deve ser EXATAMENTE um dos dois payloads,
-- sem mistura e sem duplicatas.
\set ON_ERROR_STOP on
do $$
declare
  n integer; a_count integer; b_count integer; dup integer;
  plan uuid := 'c2222222-2222-2222-2222-222222222222';
begin
  select count(*) into n
  from public.shopping_list_items i
  join public.shopping_lists l on l.id = i.shopping_list_id
  where l.meal_plan_id = plan;

  if n not in (3, 5) then
    raise exception 'concorrencia: contagem incoerente (%)', n;
  end if;

  select count(*) into dup from (
    select i.ingredient_id, i.unit
    from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = plan
    group by 1, 2 having count(*) > 1
  ) d;
  if dup > 0 then raise exception 'concorrencia: itens duplicados'; end if;

  if n = 3 then
    select count(*) into a_count
    from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = plan
      and i.ingredient_id in ('c3333333-3333-3333-3333-333333333001',
                              'c3333333-3333-3333-3333-333333333002',
                              'c3333333-3333-3333-3333-333333333003');
    if a_count <> 3 then raise exception 'concorrencia: conjunto A incompleto'; end if;
    raise notice 'PASS  concorrencia: resultado = payload A (3 itens), sem mistura';
  else
    select count(*) into b_count
    from public.shopping_list_items i
    join public.shopping_lists l on l.id = i.shopping_list_id
    where l.meal_plan_id = plan
      and i.ingredient_id in ('c3333333-3333-3333-3333-333333333001',
                              'c3333333-3333-3333-3333-333333333002',
                              'c3333333-3333-3333-3333-333333333003',
                              'c3333333-3333-3333-3333-333333333004',
                              'c3333333-3333-3333-3333-333333333005');
    if b_count <> 5 then raise exception 'concorrencia: conjunto B incompleto'; end if;
    raise notice 'PASS  concorrencia: resultado = payload B (5 itens), sem mistura';
  end if;
end $$;
select 'CONCURRENCY_OK' as result;
