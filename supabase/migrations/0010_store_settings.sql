-- DanCruShop store / payment settings (admin-configurable key-value store)
-- Run in the Supabase SQL Editor AFTER schema.sql (depends on public.set_updated_at,
-- public.is_admin). Safe to re-run.
--
-- Values are read server-side via the service role (see lib/store/settings.ts) and
-- fall back to environment variables when a key is absent. Only public-facing config
-- belongs here (VietQR bank info, store name, support email) — never secrets such as
-- API keys.

begin;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
  before update on public.app_settings
  for each row
  execute function public.set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "Admins can manage app settings" on public.app_settings;
create policy "Admins can manage app settings"
  on public.app_settings for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, update, delete on public.app_settings to authenticated;
grant all on public.app_settings to service_role;

notify pgrst, 'reload schema';

commit;
