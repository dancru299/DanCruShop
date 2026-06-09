-- DanCruShop coupons / discount codes
-- Run in the Supabase SQL Editor AFTER schema.sql (depends on public.set_updated_at,
-- public.is_admin, public.orders). Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null,
  discount_value integer not null,
  currency text,
  min_order_cents integer not null default 0,
  max_redemptions integer,
  times_redeemed integer not null default 0,
  per_user_limit integer,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_discount_type_check check (discount_type in ('percent', 'fixed')),
  constraint coupons_discount_value_check check (discount_value > 0),
  constraint coupons_percent_range_check check (
    discount_type <> 'percent' or (discount_value between 1 and 100)
  ),
  constraint coupons_fixed_currency_check check (
    discount_type <> 'fixed'
    or (currency is not null and char_length(currency) = 3)
  ),
  constraint coupons_min_order_check check (min_order_cents >= 0),
  constraint coupons_max_redemptions_check check (
    max_redemptions is null or max_redemptions > 0
  ),
  constraint coupons_times_redeemed_check check (times_redeemed >= 0),
  constraint coupons_per_user_limit_check check (
    per_user_limit is null or per_user_limit > 0
  )
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  amount_discounted_cents integer not null default 0,
  currency text,
  created_at timestamptz not null default now(),
  constraint coupon_redemptions_amount_check check (amount_discounted_cents >= 0)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists coupons_active_idx
  on public.coupons (is_active, created_at desc);

create index if not exists coupon_redemptions_coupon_id_idx
  on public.coupon_redemptions (coupon_id);

create index if not exists coupon_redemptions_user_id_idx
  on public.coupon_redemptions (user_id);

-- One redemption row per coupon per order (idempotent fulfillment).
create unique index if not exists coupon_redemptions_coupon_order_idx
  on public.coupon_redemptions (coupon_id, order_id)
  where order_id is not null;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists set_coupons_updated_at on public.coupons;
create trigger set_coupons_updated_at
  before update on public.coupons
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Atomic redemption counter (mirrors increment_download_count pattern)
-- ---------------------------------------------------------------------------

create or replace function public.increment_coupon_redemption(coupon_id_arg uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.coupons
  set times_redeemed = times_redeemed + 1
  where id = coupon_id_arg;
$$;

revoke all on function public.increment_coupon_redemption(uuid)
  from public, anon, authenticated;
grant execute on function public.increment_coupon_redemption(uuid)
  to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Coupon codes are private: validation runs server-side via the service role,
-- so anon/authenticated cannot read the coupons table directly.
-- ---------------------------------------------------------------------------

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons"
  on public.coupons for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can manage coupon redemptions" on public.coupon_redemptions;
create policy "Admins can manage coupon redemptions"
  on public.coupon_redemptions for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Users can view own coupon redemptions" on public.coupon_redemptions;
create policy "Users can view own coupon redemptions"
  on public.coupon_redemptions for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.coupons to authenticated;
grant select, insert on public.coupon_redemptions to authenticated;
grant all on public.coupons to service_role;
grant all on public.coupon_redemptions to service_role;

notify pgrst, 'reload schema';

commit;
