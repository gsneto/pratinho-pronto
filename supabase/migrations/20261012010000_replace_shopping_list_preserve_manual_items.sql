-- Redefine a RPC `replace_shopping_list` para preservar itens manuais.
--
-- Antes, recalcular a lista apagava TODOS os itens e reinseria os derivados do
-- cardápio — o que descartava silenciosamente os itens que a pessoa adicionou à
-- mão. Agora a substituição apaga apenas os itens DERIVADOS DO CARDÁPIO
-- (`ingredient_id` não nulo); os itens manuais (`ingredient_id` nulo) são
-- preservados intactos, incluindo a marcação de "comprado".
--
-- Mantém as propriedades da versão anterior: SECURITY INVOKER (RLS preservada),
-- transação única (atômica), validação explícita de identidade e posse, e
-- EXECUTE restrito a `authenticated`.
create or replace function public.replace_shopping_list(
  p_meal_plan_id uuid,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_list_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- O cardápio precisa pertencer ao usuário autenticado. A RLS já restringe,
  -- mas o erro explícito evita respostas ambíguas.
  if not exists (
    select 1
    from public.meal_plans
    where id = p_meal_plan_id
      and user_id = v_user_id
  ) then
    raise exception 'meal_plan_not_found' using errcode = '42501';
  end if;

  insert into public.shopping_lists (meal_plan_id, user_id)
  values (p_meal_plan_id, v_user_id)
  on conflict (meal_plan_id) do update set user_id = excluded.user_id
  returning id into v_list_id;

  -- Só os itens do cardápio são recalculados. Itens manuais permanecem.
  delete from public.shopping_list_items
  where shopping_list_id = v_list_id
    and ingredient_id is not null;

  insert into public.shopping_list_items (
    shopping_list_id,
    ingredient_id,
    custom_name,
    quantity,
    unit,
    checked
  )
  select
    v_list_id,
    (item->>'ingredient_id')::uuid,
    null,
    (item->>'quantity')::numeric,
    item->>'unit',
    false
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item;

  return v_list_id;
end;
$$;

-- Só usuários autenticados podem chamar. Sem acesso para anon/public.
revoke all on function public.replace_shopping_list(uuid, jsonb) from public;
revoke all on function public.replace_shopping_list(uuid, jsonb) from anon;
grant execute on function public.replace_shopping_list(uuid, jsonb) to authenticated;

comment on function public.replace_shopping_list(uuid, jsonb) is
  'Substitui atomicamente os itens DERIVADOS DO CARDÁPIO da lista do usuário autenticado, preservando itens manuais. SECURITY INVOKER: RLS preservada.';
