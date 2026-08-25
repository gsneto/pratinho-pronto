create extension if not exists pgcrypto;

create type public.ingredient_category as enum (
  'fruit', 'vegetable', 'protein', 'grain', 'dairy', 'seasoning', 'other'
);

create type public.meal_type as enum (
  'breakfast', 'lunch', 'snack', 'dinner'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  birth_date date not null check (birth_date <= current_date),
  restrictions text[] not null default '{}',
  known_allergens text[] not null default '{}',
  avoided_foods text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category public.ingredient_category not null default 'other',
  created_at timestamptz not null default now()
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  min_age_months integer not null check (min_age_months between 0 and 36),
  meal_type public.meal_type not null,
  prep_time_minutes integer not null check (prep_time_minutes > 0),
  instructions text not null,
  serving_notes text,
  storage_notes text,
  substitutions text,
  image_url text,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric(10, 2) not null check (quantity > 0),
  unit text not null check (char_length(unit) between 1 and 30),
  is_optional boolean not null default false,
  unique (recipe_id, ingredient_id, unit)
);

create table public.recipe_allergens (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  allergen text not null,
  unique (recipe_id, allergen)
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  baby_id uuid not null references public.babies(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, baby_id, week_start)
);

create table public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete restrict,
  date date not null,
  meal_type public.meal_type not null,
  position integer not null default 0 check (position >= 0),
  unique (meal_plan_id, date, meal_type, position)
);

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_id uuid not null unique references public.meal_plans(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric(10, 2) not null check (quantity > 0),
  unit text not null,
  checked boolean not null default false,
  unique (shopping_list_id, ingredient_id, unit)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  provider text,
  external_customer_id text,
  external_subscription_id text,
  plan text,
  status text not null default 'inactive',
  started_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index babies_user_id_idx on public.babies(user_id);
create index recipes_filters_idx on public.recipes(is_active, meal_type, min_age_months);
create index recipe_ingredients_recipe_idx on public.recipe_ingredients(recipe_id);
create index meal_plans_user_week_idx on public.meal_plans(user_id, week_start desc);
create index meal_plan_items_plan_date_idx on public.meal_plan_items(meal_plan_id, date);
create index shopping_lists_user_idx on public.shopping_lists(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger babies_set_updated_at before update on public.babies
for each row execute function public.set_updated_at();
create trigger recipes_set_updated_at before update on public.recipes
for each row execute function public.set_updated_at();
create trigger meal_plans_set_updated_at before update on public.meal_plans
for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.babies enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_allergens enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "babies_select_own" on public.babies
for select to authenticated using ((select auth.uid()) = user_id);
create policy "babies_insert_own" on public.babies
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "babies_update_own" on public.babies
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "babies_delete_own" on public.babies
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "ingredients_read_authenticated" on public.ingredients
for select to authenticated using (true);
create policy "recipes_read_authenticated" on public.recipes
for select to authenticated using (is_active = true);
create policy "recipe_ingredients_read_authenticated" on public.recipe_ingredients
for select to authenticated using (true);
create policy "recipe_allergens_read_authenticated" on public.recipe_allergens
for select to authenticated using (true);

create policy "meal_plans_select_own" on public.meal_plans
for select to authenticated using ((select auth.uid()) = user_id);
create policy "meal_plans_insert_own" on public.meal_plans
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.babies b
    where b.id = baby_id and b.user_id = (select auth.uid())
  )
);
create policy "meal_plans_update_own" on public.meal_plans
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "meal_plans_delete_own" on public.meal_plans
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "meal_plan_items_select_own" on public.meal_plan_items
for select to authenticated using (exists (
  select 1 from public.meal_plans mp
  where mp.id = meal_plan_id and mp.user_id = (select auth.uid())
));
create policy "meal_plan_items_insert_own" on public.meal_plan_items
for insert to authenticated with check (exists (
  select 1 from public.meal_plans mp
  where mp.id = meal_plan_id and mp.user_id = (select auth.uid())
));
create policy "meal_plan_items_update_own" on public.meal_plan_items
for update to authenticated using (exists (
  select 1 from public.meal_plans mp
  where mp.id = meal_plan_id and mp.user_id = (select auth.uid())
)) with check (exists (
  select 1 from public.meal_plans mp
  where mp.id = meal_plan_id and mp.user_id = (select auth.uid())
));
create policy "meal_plan_items_delete_own" on public.meal_plan_items
for delete to authenticated using (exists (
  select 1 from public.meal_plans mp
  where mp.id = meal_plan_id and mp.user_id = (select auth.uid())
));

create policy "shopping_lists_select_own" on public.shopping_lists
for select to authenticated using ((select auth.uid()) = user_id);
create policy "shopping_lists_insert_own" on public.shopping_lists
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.meal_plans mp
    where mp.id = meal_plan_id and mp.user_id = (select auth.uid())
  )
);
create policy "shopping_lists_update_own" on public.shopping_lists
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "shopping_lists_delete_own" on public.shopping_lists
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "shopping_list_items_select_own" on public.shopping_list_items
for select to authenticated using (exists (
  select 1 from public.shopping_lists sl
  where sl.id = shopping_list_id and sl.user_id = (select auth.uid())
));
create policy "shopping_list_items_insert_own" on public.shopping_list_items
for insert to authenticated with check (exists (
  select 1 from public.shopping_lists sl
  where sl.id = shopping_list_id and sl.user_id = (select auth.uid())
));
create policy "shopping_list_items_update_own" on public.shopping_list_items
for update to authenticated using (exists (
  select 1 from public.shopping_lists sl
  where sl.id = shopping_list_id and sl.user_id = (select auth.uid())
)) with check (exists (
  select 1 from public.shopping_lists sl
  where sl.id = shopping_list_id and sl.user_id = (select auth.uid())
));
create policy "shopping_list_items_delete_own" on public.shopping_list_items
for delete to authenticated using (exists (
  select 1 from public.shopping_lists sl
  where sl.id = shopping_list_id and sl.user_id = (select auth.uid())
));

create policy "subscriptions_select_own" on public.subscriptions
for select to authenticated using ((select auth.uid()) = user_id);
