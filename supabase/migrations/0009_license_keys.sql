-- DanCruShop license keys (auto-issued activation keys for products that need them)
-- Run in the Supabase SQL Editor AFTER schema.sql (depends on public.products,
-- public.orders, public.is_admin). Safe to re-run.

begin;

-- Flag products that should issue an activation key on fulfillment.
alter table public.products
  add column if not exists requires_license boolean not null default false;

create table if not exists public.license_keys (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  license_key text not null unique,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint license_keys_status_check check (status in ('active', 'revoked'))
);

create index if not exists license_keys_product_id_idx
  on public.license_keys (product_id);

create index if not exists license_keys_user_id_idx
  on public.license_keys (user_id);

-- One active key per user per product (idempotent issuance).
create unique index if not exists license_keys_user_product_idx
  on public.license_keys (user_id, product_id)
  where user_id is not null;

alter table public.license_keys enable row level security;

drop policy if exists "Users can view own license keys" on public.license_keys;
create policy "Users can view own license keys"
  on public.license_keys for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage license keys" on public.license_keys;
create policy "Admins can manage license keys"
  on public.license_keys for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.license_keys to authenticated;
grant all on public.license_keys to service_role;

notify pgrst, 'reload schema';

commit;
