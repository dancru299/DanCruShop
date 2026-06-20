-- DanCruShop Supabase schema
-- Run this script in the Supabase SQL Editor for a new project.
-- Scope: PRD Section 8 + Section 22.4 updates, with baseline RLS for MVP.

begin;

-- Supabase usually provides pgcrypto already, but this keeps gen_random_uuid()
-- available when the database is freshly provisioned.
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('customer', 'admin'))
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  description text,
  product_type text not null default 'digital_download',
  status text not null default 'draft',
  price_cents integer not null default 0,
  currency text not null default 'USD',
  is_free boolean not null default false,
  thumbnail_url text,
  demo_url text,
  preview_url text,
  lemon_squeezy_product_id text,
  lemon_squeezy_variant_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_product_type_check check (
    product_type in (
      'digital_download',
      'course',
      'tool',
      'template',
      'bundle',
      'free_resource'
    )
  ),
  constraint products_status_check check (status in ('draft', 'published', 'archived')),
  constraint products_price_cents_check check (price_cents >= 0),
  constraint products_currency_check check (char_length(currency) = 3),
  constraint products_free_price_check check (
    (is_free = false) or (price_cents = 0)
  )
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.product_category_map (
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists public.product_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.product_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size_bytes bigint,
  file_type text,
  version text default '1.0.0',
  is_primary boolean not null default false,
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_files_file_size_bytes_check check (
    file_size_bytes is null or file_size_bytes >= 0
  ),
  constraint product_files_download_count_check check (download_count >= 0)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  provider text not null default 'lemon_squeezy',
  provider_order_id text unique,
  status text not null default 'pending',
  total_cents integer not null,
  currency text not null default 'USD',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_provider_check check (provider in ('lemon_squeezy', 'vietqr', 'vietqr_manual')),
  constraint orders_status_check check (
    status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')
  ),
  constraint orders_total_cents_check check (total_cents >= 0),
  constraint orders_currency_check check (char_length(currency) = 3)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  price_cents integer not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  constraint order_items_price_cents_check check (price_cents >= 0),
  constraint order_items_quantity_check check (quantity > 0)
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  access_status text not null default 'active',
  purchased_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint purchases_user_product_unique unique (user_id, product_id),
  constraint purchases_access_status_check check (
    access_status in ('active', 'revoked', 'refunded', 'expired')
  )
);

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null,
  title text,
  comment text not null,
  status text not null default 'published',
  helpful_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_reviews_user_product_unique unique (user_id, product_id),
  constraint product_reviews_rating_check check (rating between 1 and 5),
  constraint product_reviews_status_check check (
    status in ('pending', 'published', 'hidden', 'flagged')
  ),
  constraint product_reviews_helpful_count_check check (helpful_count >= 0)
);

create table if not exists public.product_review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.product_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  comment text not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_review_replies_status_check check (
    status in ('pending', 'published', 'hidden', 'flagged')
  )
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.products(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint course_modules_position_check check (position >= 0)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  video_url text,
  content text,
  position integer not null default 0,
  is_preview boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_module_slug_unique unique (module_id, slug),
  constraint lessons_position_check check (position >= 0)
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image_url text,
  status text not null default 'draft',
  author_id uuid references auth.users(id) on delete set null,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_status_check check (status in ('draft', 'published', 'archived'))
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  provider_event_id text unique,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

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

-- ---------------------------------------------------------------------------
-- Functions and triggers
-- ---------------------------------------------------------------------------

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

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists set_product_reviews_updated_at on public.product_reviews;
create trigger set_product_reviews_updated_at
before update on public.product_reviews
for each row
execute function public.set_updated_at();

drop trigger if exists set_product_review_replies_updated_at on public.product_review_replies;
create trigger set_product_review_replies_updated_at
before update on public.product_review_replies
for each row
execute function public.set_updated_at();

drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at
before update on public.courses
for each row
execute function public.set_updated_at();

drop trigger if exists set_lessons_updated_at on public.lessons;
create trigger set_lessons_updated_at
before update on public.lessons
for each row
execute function public.set_updated_at();

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists products_status_created_at_idx
  on public.products (status, created_at desc);

create index if not exists products_published_free_idx
  on public.products (is_free, created_at desc)
  where status = 'published';

create index if not exists products_product_type_idx
  on public.products (product_type);

create index if not exists products_metadata_gin_idx
  on public.products using gin (metadata jsonb_path_ops);

create index if not exists product_category_map_category_id_idx
  on public.product_category_map (category_id);

create index if not exists product_favorites_product_id_created_at_idx
  on public.product_favorites (product_id, created_at desc);

create index if not exists product_files_product_id_idx
  on public.product_files (product_id);

create index if not exists product_files_product_primary_idx
  on public.product_files (product_id, is_primary);

create index if not exists orders_user_id_idx
  on public.orders (user_id);

create index if not exists orders_email_idx
  on public.orders (email);

create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

create index if not exists purchases_product_id_idx
  on public.purchases (product_id);

create index if not exists purchases_order_id_idx
  on public.purchases (order_id);

create index if not exists purchases_active_user_product_idx
  on public.purchases (user_id, product_id)
  where access_status = 'active';

create index if not exists product_reviews_product_rating_idx
  on public.product_reviews (product_id, rating)
  where status = 'published';

create index if not exists product_reviews_created_at_idx
  on public.product_reviews (created_at desc)
  where status = 'published';

create index if not exists product_review_replies_review_id_idx
  on public.product_review_replies (review_id, created_at)
  where status = 'published';

create index if not exists courses_product_id_idx
  on public.courses (product_id);

create index if not exists course_modules_course_id_position_idx
  on public.course_modules (course_id, position);

create index if not exists lessons_module_id_position_idx
  on public.lessons (module_id, position);

create index if not exists blog_posts_author_id_idx
  on public.blog_posts (author_id);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc)
  where status = 'published';

create index if not exists webhook_events_provider_created_at_idx
  on public.webhook_events (provider, created_at desc);

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

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_category_map enable row level security;
alter table public.product_favorites enable row level security;
alter table public.product_files enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.purchases enable row level security;
alter table public.product_reviews enable row level security;
alter table public.product_review_replies enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.blog_posts enable row level security;
alter table public.webhook_events enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id and role = 'customer');

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id and role = 'customer');

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view published products" on public.products;
create policy "Public can view published products"
on public.products
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view product categories" on public.product_categories;
create policy "Public can view product categories"
on public.product_categories
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage product categories" on public.product_categories;
create policy "Admins can manage product categories"
on public.product_categories
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view published product category map" on public.product_category_map;
create policy "Public can view published product category map"
on public.product_category_map
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_category_map.product_id
      and products.status = 'published'
  )
);

drop policy if exists "Admins can manage product category map" on public.product_category_map;
create policy "Admins can manage product category map"
on public.product_category_map
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users can view own product favorites" on public.product_favorites;
create policy "Users can view own product favorites"
on public.product_favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add own product favorites" on public.product_favorites;
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

drop policy if exists "Users can remove own product favorites" on public.product_favorites;
create policy "Users can remove own product favorites"
on public.product_favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage product files" on public.product_files;
create policy "Admins can manage product files"
on public.product_files
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
on public.orders
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders"
on public.orders
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users can view own order items" on public.order_items;
create policy "Users can view own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items"
on public.order_items
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users can view own purchases" on public.purchases;
create policy "Users can view own purchases"
on public.purchases
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage purchases" on public.purchases;
create policy "Admins can manage purchases"
on public.purchases
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view published product reviews" on public.product_reviews;
create policy "Public can view published product reviews"
on public.product_reviews
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Verified buyers can create product reviews" on public.product_reviews;
create policy "Verified buyers can create product reviews"
on public.product_reviews
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.purchases
    where purchases.product_id = product_reviews.product_id
      and purchases.user_id = (select auth.uid())
      and purchases.access_status = 'active'
  )
);

drop policy if exists "Review authors can update own reviews" on public.product_reviews;
create policy "Review authors can update own reviews"
on public.product_reviews
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage product reviews" on public.product_reviews;
create policy "Admins can manage product reviews"
on public.product_reviews
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view published product review replies" on public.product_review_replies;
create policy "Public can view published product review replies"
on public.product_review_replies
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.product_reviews
    where product_reviews.id = product_review_replies.review_id
      and product_reviews.status = 'published'
  )
);

drop policy if exists "Verified buyers can create product review replies" on public.product_review_replies;
create policy "Verified buyers can create product review replies"
on public.product_review_replies
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.product_reviews
    join public.purchases on purchases.product_id = product_reviews.product_id
    where product_reviews.id = product_review_replies.review_id
      and product_reviews.status = 'published'
      and purchases.user_id = (select auth.uid())
      and purchases.access_status = 'active'
  )
);

drop policy if exists "Reply authors can update own product review replies" on public.product_review_replies;
create policy "Reply authors can update own product review replies"
on public.product_review_replies
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage product review replies" on public.product_review_replies;
create policy "Admins can manage product review replies"
on public.product_review_replies
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view published courses" on public.courses;
create policy "Public can view published courses"
on public.courses
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = courses.product_id
      and products.status = 'published'
  )
);

drop policy if exists "Admins can manage courses" on public.courses;
create policy "Admins can manage courses"
on public.courses
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view published course modules" on public.course_modules;
create policy "Public can view published course modules"
on public.course_modules
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.courses
    join public.products on products.id = courses.product_id
    where courses.id = course_modules.course_id
      and products.status = 'published'
  )
);

drop policy if exists "Admins can manage course modules" on public.course_modules;
create policy "Admins can manage course modules"
on public.course_modules
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view preview lessons" on public.lessons;
create policy "Public can view preview lessons"
on public.lessons
for select
to anon, authenticated
using (
  is_preview = true
  and exists (
    select 1
    from public.course_modules
    join public.courses on courses.id = course_modules.course_id
    join public.products on products.id = courses.product_id
    where course_modules.id = lessons.module_id
      and products.status = 'published'
  )
);

drop policy if exists "Users can view purchased lessons" on public.lessons;
create policy "Users can view purchased lessons"
on public.lessons
for select
to authenticated
using (
  exists (
    select 1
    from public.course_modules
    join public.courses on courses.id = course_modules.course_id
    join public.purchases on purchases.product_id = courses.product_id
    where course_modules.id = lessons.module_id
      and purchases.user_id = (select auth.uid())
      and purchases.access_status = 'active'
  )
);

drop policy if exists "Admins can manage lessons" on public.lessons;
create policy "Admins can manage lessons"
on public.lessons
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view published blog posts" on public.blog_posts;
create policy "Public can view published blog posts"
on public.blog_posts
for select
to anon, authenticated
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

drop policy if exists "Admins can manage blog posts" on public.blog_posts;
create policy "Admins can manage blog posts"
on public.blog_posts
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can manage webhook events" on public.webhook_events;
create policy "Admins can manage webhook events"
on public.webhook_events
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can view analytics events" on public.analytics_events;
create policy "Admins can view analytics events"
on public.analytics_events
for select
to authenticated
using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- API grants for Supabase anon/authenticated roles
-- RLS policies above remain the source of truth for row access.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant select
on public.products,
   public.product_categories,
   public.product_category_map,
   public.product_reviews,
   public.product_review_replies,
   public.courses,
   public.course_modules,
   public.lessons,
   public.blog_posts
to anon;

grant select, insert, update
on public.profiles
to authenticated;

grant select, insert, update, delete
on public.products,
   public.product_categories,
   public.product_category_map,
   public.product_files,
   public.orders,
   public.order_items,
   public.purchases,
   public.product_reviews,
   public.product_review_replies,
   public.courses,
   public.course_modules,
   public.lessons,
   public.blog_posts,
   public.webhook_events
to authenticated;

grant select, insert, delete
on public.product_favorites
to authenticated;

grant select
on public.analytics_events
to authenticated;

grant all
on all tables in schema public
to service_role;

grant execute
on function public.is_admin()
to authenticated;

-- ---------------------------------------------------------------------------
-- Course progress tracking (Phase 4 migration)
-- ---------------------------------------------------------------------------

create table if not exists public.course_progress (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  lesson_id    uuid        not null references public.lessons(id) on delete cascade,
  course_id    uuid        not null references public.courses(id) on delete cascade,
  completed    boolean     not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint course_progress_user_lesson_unique unique (user_id, lesson_id)
);

create index if not exists course_progress_user_course_idx
  on public.course_progress (user_id, course_id);

alter table public.course_progress enable row level security;

drop policy if exists "Users can manage own course progress" on public.course_progress;
create policy "Users can manage own course progress"
  on public.course_progress for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage course progress" on public.course_progress;
create policy "Admins can manage course progress"
  on public.course_progress for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists set_course_progress_updated_at on public.course_progress;
create trigger set_course_progress_updated_at
  before update on public.course_progress
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.course_progress to authenticated;
grant all on public.course_progress to service_role;

-- ---------------------------------------------------------------------------
-- Download limits & per-user tracking (Phase 3 migration)
-- ---------------------------------------------------------------------------

alter table public.product_files
  add column if not exists max_downloads_per_user integer;

create table if not exists public.download_logs (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  product_id    uuid        not null references public.products(id) on delete cascade,
  file_id       uuid        not null references public.product_files(id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

create index if not exists download_logs_user_file_idx
  on public.download_logs (user_id, file_id);

create index if not exists download_logs_user_product_idx
  on public.download_logs (user_id, product_id);

create index if not exists download_logs_file_id_idx
  on public.download_logs (file_id, downloaded_at desc);

-- Atomic counter increment to avoid race conditions on concurrent downloads
create or replace function public.increment_download_count(file_id_arg uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.product_files
  set download_count = download_count + 1
  where id = file_id_arg;
$$;

revoke all on function public.increment_download_count(uuid)
  from public, anon, authenticated;
grant execute on function public.increment_download_count(uuid)
  to service_role;

alter table public.download_logs enable row level security;

drop policy if exists "Users can view own download logs" on public.download_logs;
create policy "Users can view own download logs"
  on public.download_logs for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can manage download logs" on public.download_logs;
create policy "Admins can manage download logs"
  on public.download_logs for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert on public.download_logs to authenticated;
grant all on public.download_logs to service_role;

-- ---------------------------------------------------------------------------
-- Full-text search for products (Phase 2 migration)
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists search_vector tsvector
    generated always as (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(short_description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'C')
    ) stored;

create index if not exists products_search_vector_idx
  on public.products using gin(search_vector);

notify pgrst, 'reload schema';

commit;
