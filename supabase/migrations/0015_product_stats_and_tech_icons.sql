-- DanCruShop: product stats (rating + sales) and a shared tech-icon library.
--
-- Backs the home Hero spotlight slider and the iMac showcase section, which
-- need per-product rating, sales/downloads, and tech-stack badges. Curation is
-- automatic (top sellers / best rated), so there is no editorial table here —
-- the storefront ranks published products by these cached columns.
--
--   rating_average / rating_count  -> recomputed from published product_reviews
--   sales_count                    -> recomputed from active purchases
--   tech_icons + product_tech_icons-> reusable icon library, attached per product
--
-- Cached counters are maintained by triggers so the homepage reads a single
-- indexed column instead of aggregating reviews/purchases on every request.
--
-- Run in the Supabase SQL Editor AFTER schema.sql. Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1. Cached stat columns on products
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists rating_average numeric(3, 2) not null default 0,
  add column if not exists rating_count integer not null default 0,
  add column if not exists sales_count integer not null default 0;

alter table public.products
  drop constraint if exists products_rating_average_check;
alter table public.products
  add constraint products_rating_average_check
  check (rating_average >= 0 and rating_average <= 5);

alter table public.products
  drop constraint if exists products_rating_count_check;
alter table public.products
  add constraint products_rating_count_check check (rating_count >= 0);

alter table public.products
  drop constraint if exists products_sales_count_check;
alter table public.products
  add constraint products_sales_count_check check (sales_count >= 0);

-- Ranks published products for the Hero / showcase curation.
create index if not exists products_published_popularity_idx
  on public.products (sales_count desc, rating_average desc, created_at desc)
  where status = 'published';

-- ---------------------------------------------------------------------------
-- 2. Recompute functions (rating + sales)
--
-- Written in plpgsql so the embedded queries are planned at call time, not at
-- creation. This lets the migration install cleanly even on databases that do
-- not have product_reviews / purchases yet (older schema versions) — the
-- triggers and backfill below are only wired up when those tables exist.
-- ---------------------------------------------------------------------------

create or replace function public.recompute_product_rating(product_id_arg uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products p
  set
    rating_average = coalesce((
      select round(avg(r.rating)::numeric, 2)
      from public.product_reviews r
      where r.product_id = product_id_arg
        and r.status = 'published'
    ), 0),
    rating_count = coalesce((
      select count(*)
      from public.product_reviews r
      where r.product_id = product_id_arg
        and r.status = 'published'
    ), 0)
  where p.id = product_id_arg;
end;
$$;

create or replace function public.sync_product_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_product_rating(old.product_id);
    return old;
  end if;

  perform public.recompute_product_rating(new.product_id);

  -- A review reassigned to another product (rare) must refresh both sides.
  if (tg_op = 'UPDATE' and new.product_id is distinct from old.product_id) then
    perform public.recompute_product_rating(old.product_id);
  end if;

  return new;
end;
$$;

create or replace function public.recompute_product_sales(product_id_arg uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products p
  set sales_count = coalesce((
    select count(*)
    from public.purchases pu
    where pu.product_id = product_id_arg
      and pu.access_status = 'active'
  ), 0)
  where p.id = product_id_arg;
end;
$$;

create or replace function public.sync_product_sales()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_product_sales(old.product_id);
    return old;
  end if;

  perform public.recompute_product_sales(new.product_id);

  if (tg_op = 'UPDATE' and new.product_id is distinct from old.product_id) then
    perform public.recompute_product_sales(old.product_id);
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Wire triggers + backfill for whichever source tables exist
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.product_reviews') is not null then
    drop trigger if exists sync_product_rating on public.product_reviews;
    create trigger sync_product_rating
    after insert or update or delete on public.product_reviews
    for each row
    execute function public.sync_product_rating();

    update public.products p
    set rating_average = coalesce(stats.avg_rating, 0),
        rating_count = coalesce(stats.cnt, 0)
    from (
      select product_id,
             round(avg(rating)::numeric, 2) as avg_rating,
             count(*) as cnt
      from public.product_reviews
      where status = 'published'
      group by product_id
    ) stats
    where stats.product_id = p.id;
  else
    raise notice 'Skipping rating triggers: public.product_reviews does not exist yet.';
  end if;

  if to_regclass('public.purchases') is not null then
    drop trigger if exists sync_product_sales on public.purchases;
    create trigger sync_product_sales
    after insert or update or delete on public.purchases
    for each row
    execute function public.sync_product_sales();

    update public.products p
    set sales_count = coalesce(stats.cnt, 0)
    from (
      select product_id, count(*) as cnt
      from public.purchases
      where access_status = 'active'
      group by product_id
    ) stats
    where stats.product_id = p.id;
  else
    raise notice 'Skipping sales triggers: public.purchases does not exist yet.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Shared tech-icon library
-- ---------------------------------------------------------------------------

create table if not exists public.tech_icons (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  slug text not null unique,
  -- Uploaded icon asset (public path/URL). Null -> the UI renders initials.
  icon_url text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_tech_icons (
  product_id uuid not null references public.products(id) on delete cascade,
  tech_icon_id uuid not null references public.tech_icons(id) on delete cascade,
  position integer not null default 0,
  primary key (product_id, tech_icon_id)
);

create index if not exists product_tech_icons_product_idx
  on public.product_tech_icons (product_id, position);

create index if not exists product_tech_icons_tech_icon_idx
  on public.product_tech_icons (tech_icon_id);

drop trigger if exists set_tech_icons_updated_at on public.tech_icons;
create trigger set_tech_icons_updated_at
before update on public.tech_icons
for each row
execute function public.set_updated_at();

-- Seed the most common stacks. icon_url stays null until real assets are
-- uploaded; the storefront falls back to label initials in the meantime.
insert into public.tech_icons (label, slug, position) values
  ('Laravel', 'laravel', 10),
  ('Livewire', 'livewire', 20),
  ('Filament', 'filament', 30),
  ('Alpine.js', 'alpinejs', 40),
  ('Tailwind CSS', 'tailwindcss', 50),
  ('Next.js', 'nextjs', 60),
  ('React', 'react', 70),
  ('Vue', 'vue', 80),
  ('Nuxt', 'nuxt', 90),
  ('TypeScript', 'typescript', 100),
  ('Node.js', 'nodejs', 110),
  ('Supabase', 'supabase', 120),
  ('PostgreSQL', 'postgresql', 130),
  ('Figma', 'figma', 140),
  ('Stripe', 'stripe', 150)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 5. RLS + grants for the tech-icon tables
-- ---------------------------------------------------------------------------

alter table public.tech_icons enable row level security;
alter table public.product_tech_icons enable row level security;

drop policy if exists "Public can view tech icons" on public.tech_icons;
create policy "Public can view tech icons"
on public.tech_icons
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage tech icons" on public.tech_icons;
create policy "Admins can manage tech icons"
on public.tech_icons
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view published product tech icons" on public.product_tech_icons;
create policy "Public can view published product tech icons"
on public.product_tech_icons
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_tech_icons.product_id
      and products.status = 'published'
  )
);

drop policy if exists "Admins can manage product tech icons" on public.product_tech_icons;
create policy "Admins can manage product tech icons"
on public.product_tech_icons
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant select on public.tech_icons, public.product_tech_icons to anon;
grant select, insert, update, delete
  on public.tech_icons, public.product_tech_icons
  to authenticated;
grant all on public.tech_icons, public.product_tech_icons to service_role;

notify pgrst, 'reload schema';

commit;
