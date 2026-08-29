-- Access is granted by the payment webhook (using the Supabase service role).
-- The browser never receives a list of purchased e-mails.
create table public.access_grants (
  email text primary key check (email = lower(email) and char_length(email) between 3 and 320),
  status text not null default 'active' check (status in ('active', 'revoked')),
  provider text,
  external_order_id text unique,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index access_grants_status_idx on public.access_grants(status);

create trigger access_grants_set_updated_at before update on public.access_grants
for each row execute function public.set_updated_at();

alter table public.access_grants enable row level security;

-- No client policy is intentional. Only the server-side payment integration
-- (service_role) can insert, update, or read grants.

-- Keep existing test accounts working when this migration is first applied.
insert into public.access_grants (email, provider, granted_at)
select lower(email), 'legacy', created_at
from auth.users
where email is not null
on conflict (email) do nothing;

create or replace function public.assert_purchase_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.access_grants
    where email = lower(new.email)
      and status = 'active'
  ) then
    raise exception 'access_not_granted' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- A new account can only be created after the payment webhook has inserted
-- the buyer's e-mail in access_grants. This also protects signup if the UI
-- is called directly.
create trigger on_auth_user_purchase_access
before insert on auth.users
for each row execute function public.assert_purchase_access();
