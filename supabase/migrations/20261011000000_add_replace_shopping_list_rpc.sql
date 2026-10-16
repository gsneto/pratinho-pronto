-- Substitui os itens da lista de compras de um cardápio de forma ATÔMICA.
--
-- Motivação: o cliente fazia upsert da lista + delete de itens + insert de itens
-- em três chamadas separadas. Uma falha entre o delete e o insert deixava a
-- lista vazia (perda de dados). Uma função plpgsql executa tudo em uma única
-- transação: ou a substituição inteira é confirmada, ou nada muda.
--
-- Segurança: a função é SECURITY INVOKER (padrão), então roda com os privilégios
-- do usuário autenticado e as políticas RLS continuam valendo — não há bypass de
-- RLS. Além disso, valida explicitamente a identidade e a posse do cardápio,
-- devolvendo erros claros. Não usamos SECURITY DEFINER.
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

  delete from public.shopping_list_items
  where shopping_list_id = v_list_id;

  insert into public.shopping_list_items (
    shopping_list_id,
    ingredient_id,
    quantity,
    unit,
    checked
  )
  select
    v_list_id,
    (item->>'ingredient_id')::uuid,
    (item->>'quantity')::numeric,
    item->>'unit',
    false
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item;

  return v_list_id;
end;
$$;

-- Só usuários autenticados podem chamar. Sem acesso para anon/public.
-- O Supabase concede EXECUTE em funções novas a anon/authenticated/service_role
-- por default privileges, então é preciso revogar explicitamente de anon
-- (revogar só de public não remove o grant do papel anon).
revoke all on function public.replace_shopping_list(uuid, jsonb) from public;
revoke all on function public.replace_shopping_list(uuid, jsonb) from anon;
grant execute on function public.replace_shopping_list(uuid, jsonb) to authenticated;

comment on function public.replace_shopping_list(uuid, jsonb) is
  'Substitui atomicamente os itens da lista de compras do cardápio do usuário autenticado. SECURITY INVOKER: RLS preservada.';
