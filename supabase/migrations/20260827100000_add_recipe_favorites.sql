create table if not exists public.recipe_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists recipe_favorites_recipe_idx
  on public.recipe_favorites(recipe_id);

alter table public.recipe_favorites enable row level security;

drop policy if exists "recipe_favorites_select_own" on public.recipe_favorites;
create policy "recipe_favorites_select_own" on public.recipe_favorites
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "recipe_favorites_insert_own" on public.recipe_favorites;
create policy "recipe_favorites_insert_own" on public.recipe_favorites
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "recipe_favorites_delete_own" on public.recipe_favorites;
create policy "recipe_favorites_delete_own" on public.recipe_favorites
for delete to authenticated using ((select auth.uid()) = user_id);
