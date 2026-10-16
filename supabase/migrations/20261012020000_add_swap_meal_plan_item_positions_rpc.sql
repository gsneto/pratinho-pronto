-- Troca atomicamente a posição de duas refeições do MESMO dia e tipo.
--
-- Motivação: o cliente fazia 3 updates em sequência com uma posição temporária
-- calculada no cliente (`max(das duas) + 1`). Duas falhas reais:
--
--   1. Colisão: quando havia uma terceira refeição do mesmo tipo/dia, a posição
--      temporária coincidia com a dela e o índice único
--      (meal_plan_id, date, meal_type, position) recusava a troca.
--   2. Atomicidade: uma falha entre os updates deixava a ordem inconsistente no
--      banco (o item ficava na posição temporária) sem que o usuário soubesse.
--
-- A função resolve os dois: calcula uma posição temporária LIVRE dentro do
-- grupo e troca tudo em uma única transação. Mantém SECURITY INVOKER (RLS
-- preservada) e valida identidade, posse e que os dois itens estão no mesmo
-- cardápio/dia/tipo — recusando combinações que corromperiam a ordem.
create or replace function public.swap_meal_plan_item_positions(
  p_first uuid,
  p_second uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_first public.meal_plan_items;
  v_second public.meal_plan_items;
  v_temp integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_first = p_second then
    return;
  end if;

  select i.* into v_first
  from public.meal_plan_items i
  join public.meal_plans mp on mp.id = i.meal_plan_id
  where i.id = p_first and mp.user_id = v_user_id;

  select i.* into v_second
  from public.meal_plan_items i
  join public.meal_plans mp on mp.id = i.meal_plan_id
  where i.id = p_second and mp.user_id = v_user_id;

  if v_first.id is null or v_second.id is null then
    raise exception 'meal_plan_item_not_found' using errcode = '42501';
  end if;

  if v_first.meal_plan_id <> v_second.meal_plan_id
     or v_first.date <> v_second.date
     or v_first.meal_type <> v_second.meal_type then
    raise exception 'items_not_in_same_slot' using errcode = '22023';
  end if;

  -- Posição temporária livre no grupo: uma acima da maior do grupo, então
  -- nunca colide com uma terceira refeição do mesmo tipo/dia.
  select coalesce(max(i.position), -1) + 1 into v_temp
  from public.meal_plan_items i
  where i.meal_plan_id = v_first.meal_plan_id
    and i.date = v_first.date
    and i.meal_type = v_first.meal_type;

  update public.meal_plan_items set position = v_temp where id = v_first.id;
  update public.meal_plan_items set position = v_first.position where id = v_second.id;
  update public.meal_plan_items set position = v_second.position where id = v_first.id;
end;
$$;

-- Só usuários autenticados podem chamar. Sem acesso para anon/public.
revoke all on function public.swap_meal_plan_item_positions(uuid, uuid) from public;
revoke all on function public.swap_meal_plan_item_positions(uuid, uuid) from anon;
grant execute on function public.swap_meal_plan_item_positions(uuid, uuid) to authenticated;

comment on function public.swap_meal_plan_item_positions(uuid, uuid) is
  'Troca atomicamente a posição de duas refeições do mesmo dia/tipo. SECURITY INVOKER: RLS preservada.';
