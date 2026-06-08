-- DanCruShop beta launch readiness patch.
-- Run in Supabase SQL Editor for an existing project before beta launch.

begin;

-- Favorites table used by the header/product favorite flow.
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

-- Internal analytics events. Client code writes through /api/analytics only.
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  anonymous_id text,
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  path text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint analytics_events_event_name_check check (
    event_name in (
      'page_view',
      'product_view',
      'add_to_cart',
      'favorite_toggle',
      'checkout_start',
      'checkout_error',
      'vietqr_order_created',
      'download_start',
      'download_success',
      'download_error'
    )
  )
);

create index if not exists analytics_events_event_created_at_idx
  on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_product_created_at_idx
  on public.analytics_events (product_id, created_at desc)
  where product_id is not null;

create index if not exists analytics_events_order_created_at_idx
  on public.analytics_events (order_id, created_at desc)
  where order_id is not null;

create index if not exists analytics_events_user_created_at_idx
  on public.analytics_events (user_id, created_at desc)
  where user_id is not null;

alter table public.analytics_events enable row level security;

drop policy if exists "Admins can view analytics events"
  on public.analytics_events;
create policy "Admins can view analytics events"
on public.analytics_events
for select
to authenticated
using ((select public.is_admin()));

revoke all on public.analytics_events from anon;
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;

notify pgrst, 'reload schema';

commit;
