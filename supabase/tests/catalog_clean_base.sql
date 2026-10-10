-- Validação do catálogo em uma base LIMPA (após migrações + seed).
-- Complementa a checagem embutida no seed, reportando os números observados.
\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.assert_true(label text, cond boolean)
returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL %', label; end if;
  raise notice 'PASS  %', label;
end $$;

do $$
declare
  recipes integer; ingredients integer; duplicates integer;
  without_ingredient integer; per_type integer; linked integer;
begin
  select count(*) into recipes from public.recipes where is_demo and is_active;
  select count(*) into ingredients from public.ingredients;
  select count(*) into duplicates from (select name from public.recipes group by name having count(*) > 1) d;
  select count(*) into without_ingredient from public.recipes r
    where r.is_demo and r.is_active
      and not exists (select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id and not ri.is_optional);
  select min(c) into per_type from (
    select count(*) c from public.recipes where is_demo and is_active group by meal_type
  ) t;
  -- Receitas da expansão (as 48) precisam ter vínculo de ingrediente resolvido.
  select count(*) into linked from public.recipe_ingredients;

  raise notice 'catálogo: % receitas, % ingredientes, % vínculos', recipes, ingredients, linked;
  perform pg_temp.assert_true('base limpa: 72 receitas', recipes = 72);
  perform pg_temp.assert_true('base limpa: 36 ingredientes', ingredients = 36);
  perform pg_temp.assert_true('base limpa: nenhum nome duplicado', duplicates = 0);
  perform pg_temp.assert_true('base limpa: nenhuma receita sem ingrediente obrigatório', without_ingredient = 0);
  perform pg_temp.assert_true('base limpa: ao menos 18 receitas por tipo', per_type >= 18);
  perform pg_temp.assert_true('base limpa: vínculos de ingredientes presentes', linked >= 72);
end $$;

select 'CATALOG_CLEAN_BASE_OK' as result;
rollback;
