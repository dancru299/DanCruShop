-- Easter Egg Discount Claims tracking
-- Run in the Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).
--
-- Tracks who claimed the `sudo discount` easter egg to enforce
-- one-per-user and budget cap (max 50 claims total).

begin;

-- ==========================================================================
-- easter_egg_claims table
-- ==========================================================================
create table if not exists public.easter_egg_claims (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  ip text,
  created_at timestamptz not null default now(),
  constraint easter_egg_claims_user_unique unique (user_id)
);

-- Enable RLS (claims are only writable via server-side service role)
alter table public.easter_egg_claims enable row level security;

-- Admins can read claims for auditing (reuses the project's is_admin() helper)
create policy "Admins can read easter egg claims"
  on public.easter_egg_claims
  for select
  using (public.is_admin());

-- ==========================================================================
-- Index
-- ==========================================================================
create index if not exists idx_easter_egg_claims_user_id
  on public.easter_egg_claims (user_id);

create index if not exists idx_easter_egg_claims_created_at
  on public.easter_egg_claims (created_at);

commit;