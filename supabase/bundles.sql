-- DanCruShop bundle composition (a bundle product unlocks its child products)
-- Run in the Supabase SQL Editor AFTER schema.sql (depends on public.products,
-- public.is_admin). Safe to re-run.

begin;

create table if not exists public.bundle_items (
  bundle_product_id uuid not null references public.products(id) on delete cascade,
  child_product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (bundle_product_id, child_product_id),
  constraint bundle_items_no_self check (bundle_product_id <> child_product_id),
  constraint bundle_items_position_check check (position >= 0)
);

create index if not exists bundle_items_bundle_idx
  on public.bundle_items (bundle_product_id, position);

create index if not exists bundle_items_child_idx
  on public.bundle_items (child_product_id);

alter table public.bundle_items enable row level security;

drop policy if exists "Public can view bundle items of published products" on public.bundle_items;
create policy "Public can view bundle items of published products"
  on public.bundle_items for select to anon, authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = bundle_items.bundle_product_id
        and p.status = 'published'
    )
  );

drop policy if exists "Admins can manage bundle items" on public.bundle_items;
create policy "Admins can manage bundle items"
  on public.bundle_items for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.bundle_items to anon;
grant select, insert, update, delete on public.bundle_items to authenticated;
grant all on public.bundle_items to service_role;

notify pgrst, 'reload schema';

commit;
