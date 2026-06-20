-- DanCruShop product favorites patch.
-- Run in Supabase SQL Editor when enabling the favorites feature on an
-- existing project that was created before public.product_favorites existed.

begin;

create table if not exists public.product_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists product_favorites_product_id_created_at_idx
  on public.product_favorites (product_id, created_at desc);

alter table public.product_favorites enable row level security;

drop policy if exists "Users can view own product favorites"
  on public.product_favorites;
create policy "Users can view own product favorites"
on public.product_favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own product favorites"
  on public.product_favorites;
create policy "Users can add own product favorites"
on public.product_favorites
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.products
    where products.id = product_favorites.product_id
      and products.status = 'published'
  )
);

drop policy if exists "Users can remove own product favorites"
  on public.product_favorites;
create policy "Users can remove own product favorites"
on public.product_favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.product_favorites from anon;
grant select, insert, delete on public.product_favorites to authenticated;
grant all on public.product_favorites to service_role;

notify pgrst, 'reload schema';

commit;
