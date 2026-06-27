-- DanCruShop: real product variants.
--
-- Replaces the "each option is a full product row grouped by option_group_id"
-- model with one product + a lightweight product_variants table. A variant is a
-- purchasable version of the SAME product: its own name, price, files and Lemon
-- Squeezy variant — but the product owns the shared content (title, slug,
-- description, images, category, specs, currency, status).
--
-- The product row keeps price_cents / compare_at_price_cents / is_free /
-- lemon_squeezy_variant_id / requires_license as a MIRROR of its default variant
-- so the catalog/listing/search (which read products.price_cents) need no change.
--
-- Run once in the Supabase SQL Editor AFTER 0001..0019. Idempotent. Because the
-- current catalog is mock data, a clean reseed is recommended after this.

begin;

-- 1. The variants table -----------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null default '',
  price_cents integer not null default 0,
  compare_at_price_cents integer,
  is_free boolean not null default false,
  position integer not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  lemon_squeezy_variant_id text,
  requires_license boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_price_cents_check check (price_cents >= 0),
  constraint product_variants_compare_check check (
    compare_at_price_cents is null or compare_at_price_cents > price_cents
  ),
  constraint product_variants_position_check check (position >= 0)
);

create index if not exists product_variants_product_idx
  on public.product_variants (product_id, position);

-- At most one default variant per product.
create unique index if not exists product_variants_one_default_idx
  on public.product_variants (product_id)
  where is_default;

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- 2. variant_id on the file + commerce tables -------------------------------
alter table public.product_files
  add column if not exists variant_id uuid
    references public.product_variants(id) on delete cascade;
create index if not exists product_files_variant_idx
  on public.product_files (variant_id);

alter table public.order_items
  add column if not exists variant_id uuid
    references public.product_variants(id) on delete set null;

alter table public.purchases
  add column if not exists variant_id uuid
    references public.product_variants(id) on delete cascade;

alter table public.download_logs
  add column if not exists variant_id uuid
    references public.product_variants(id) on delete set null;

-- 3. Backfill: one default variant per existing product ---------------------
insert into public.product_variants (
  product_id, name, price_cents, compare_at_price_cents, is_free, position,
  is_default, is_active, lemon_squeezy_variant_id, requires_license
)
select
  p.id,
  coalesce(nullif(p.option_label, ''), 'Mặc định'),
  p.price_cents,
  p.compare_at_price_cents,
  p.is_free,
  0,
  true,
  true,
  p.lemon_squeezy_variant_id,
  p.requires_license
from public.products p
where not exists (
  select 1 from public.product_variants v where v.product_id = p.id
);

-- Point existing files / purchases at each product's default variant.
update public.product_files f
set variant_id = v.id
from public.product_variants v
where v.product_id = f.product_id
  and v.is_default
  and f.variant_id is null;

update public.purchases pu
set variant_id = v.id
from public.product_variants v
where v.product_id = pu.product_id
  and v.is_default
  and pu.variant_id is null;

-- 4. purchases uniqueness now includes the variant --------------------------
alter table public.purchases
  drop constraint if exists purchases_user_product_unique;
drop index if exists purchases_user_product_variant_unique;
create unique index purchases_user_product_variant_unique
  on public.purchases (user_id, product_id, variant_id);

-- 5. Fulfilment writes variant_id -------------------------------------------
create or replace function public.fulfill_paid_order(
  p_provider_order_id text,
  p_email text,
  p_currency text,
  p_total_cents integer,
  p_user_id uuid,
  p_raw_payload jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  insert into public.orders as o (
    provider, provider_order_id, email, currency, total_cents, status,
    user_id, raw_payload
  )
  values (
    'lemon_squeezy', p_provider_order_id, p_email, p_currency, p_total_cents,
    'paid', p_user_id, p_raw_payload
  )
  on conflict (provider_order_id) do update
    set email = excluded.email,
        currency = excluded.currency,
        total_cents = excluded.total_cents,
        status = 'paid',
        user_id = excluded.user_id,
        raw_payload = excluded.raw_payload,
        updated_at = now()
  returning o.id into v_order_id;

  delete from public.order_items where order_id = v_order_id;

  insert into public.order_items (order_id, product_id, variant_id, price_cents, quantity)
  select
    v_order_id,
    (item->>'product_id')::uuid,
    nullif(item->>'variant_id', '')::uuid,
    (item->>'price_cents')::integer,
    coalesce((item->>'quantity')::integer, 1)
  from jsonb_array_elements(p_items) as item;

  insert into public.purchases (user_id, product_id, variant_id, order_id, access_status)
  select
    p_user_id,
    (item->>'product_id')::uuid,
    nullif(item->>'variant_id', '')::uuid,
    v_order_id,
    'active'
  from jsonb_array_elements(p_items) as item
  on conflict (user_id, product_id, variant_id) do update
    set access_status = 'active',
        order_id = excluded.order_id;

  return v_order_id;
end;
$$;

revoke all on function public.fulfill_paid_order(
  text, text, text, integer, uuid, jsonb, jsonb
) from public;
grant execute on function public.fulfill_paid_order(
  text, text, text, integer, uuid, jsonb, jsonb
) to service_role;

-- 6. RLS for product_variants -----------------------------------------------
alter table public.product_variants enable row level security;

drop policy if exists "Public can view variants of published products" on public.product_variants;
create policy "Public can view variants of published products"
  on public.product_variants for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'published'
    )
  );

drop policy if exists "Admins can manage variants" on public.product_variants;
create policy "Admins can manage variants"
  on public.product_variants for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.product_variants to anon;
grant select, insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;

-- 7. Drop the old grouped-options model -------------------------------------
alter table public.products drop constraint if exists products_option_default_requires_group_check;
alter table public.products drop constraint if exists products_option_position_check;
alter table public.products drop column if exists is_option_default cascade;
alter table public.products drop column if exists option_position cascade;
alter table public.products drop column if exists option_label cascade;
alter table public.products drop column if exists option_group_id cascade;
drop table if exists public.product_option_groups cascade;

notify pgrst, 'reload schema';

commit;
