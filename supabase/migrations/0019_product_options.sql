-- DanCruShop product options (variant groups). The same listing can be sold as
-- several distinct products — e.g. a "code only" tier vs a "plus" tier with an
-- admin panel, or different colours — each with its own price, files, license
-- and Lemon Squeezy variant. We model every option as a full row in
-- public.products (reusing all fulfilment machinery) and gather them under one
-- option group so the storefront can show a single listing with an option
-- selector.
--
-- Run in the Supabase SQL Editor AFTER schema.sql. Depends on public.products
-- and public.is_admin. Safe to re-run.

begin;

create table if not exists public.product_option_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Each product may belong to at most one option group. When it does,
-- option_label is what the storefront selector shows ("Bản thô", "Plus", "Đỏ").
-- Exactly one member per group is flagged as the default — the one shown in the
-- catalog and opened by default on the listing page.
alter table public.products
  add column if not exists option_group_id uuid
    references public.product_option_groups(id) on delete set null;
alter table public.products
  add column if not exists option_label text;
alter table public.products
  add column if not exists option_position integer not null default 0;
alter table public.products
  add column if not exists is_option_default boolean not null default false;

alter table public.products
  drop constraint if exists products_option_position_check;
alter table public.products
  add constraint products_option_position_check check (option_position >= 0);

-- A product flagged as default must actually be part of a group.
alter table public.products
  drop constraint if exists products_option_default_requires_group_check;
alter table public.products
  add constraint products_option_default_requires_group_check check (
    is_option_default = false or option_group_id is not null
  );

create index if not exists products_option_group_idx
  on public.products (option_group_id, option_position);

-- At most one default option per group.
create unique index if not exists products_one_default_per_group_idx
  on public.products (option_group_id)
  where is_option_default;

alter table public.product_option_groups enable row level security;

drop policy if exists "Public can view option groups" on public.product_option_groups;
create policy "Public can view option groups"
  on public.product_option_groups for select to anon, authenticated
  using (true);

drop policy if exists "Admins can manage option groups" on public.product_option_groups;
create policy "Admins can manage option groups"
  on public.product_option_groups for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.product_option_groups to anon;
grant select, insert, update, delete on public.product_option_groups to authenticated;
grant all on public.product_option_groups to service_role;

notify pgrst, 'reload schema';

commit;
