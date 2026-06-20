-- DanCruShop distributed rate limiter.
-- Run in the Supabase SQL Editor. Backs lib/rate-limit.ts::enforceRateLimit so
-- the limit is shared across all serverless instances instead of living in a
-- single process's memory.

begin;

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- Lets a scheduled job prune expired windows cheaply (optional housekeeping).
create index if not exists rate_limits_reset_at_idx
  on public.rate_limits (reset_at);

-- The table is only ever touched by the service role through the RPC below.
-- Enable RLS and add no policies so anon/authenticated have no direct access.
alter table public.rate_limits enable row level security;

revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;

-- Atomic fixed-window check-and-increment. The INSERT ... ON CONFLICT DO UPDATE
-- takes a row lock on the key, so concurrent callers serialize and the counter
-- can never exceed p_max. Returns whether the request is allowed and how many
-- requests remain in the current window.
create or replace function public.consume_rate_limit(
  p_key text,
  p_max integer,
  p_window_ms integer
)
returns table (allowed boolean, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window interval := make_interval(secs => greatest(p_window_ms, 0) / 1000.0);
  v_count integer;
begin
  if p_max < 1 then
    return query select false, 0;
    return;
  end if;

  insert into public.rate_limits as rl (key, count, reset_at, updated_at)
  values (p_key, 1, v_now + v_window, v_now)
  on conflict (key) do update
    set
      count = case when rl.reset_at <= v_now then 1 else rl.count + 1 end,
      reset_at = case when rl.reset_at <= v_now then v_now + v_window else rl.reset_at end,
      updated_at = v_now
  returning rl.count into v_count;

  if v_count > p_max then
    -- Clamp so a flood of blocked requests cannot grow the stored counter.
    update public.rate_limits set count = p_max where key = p_key;
    return query select false, 0;
  end if;

  return query select true, p_max - v_count;
end;
$$;

-- Only the service role (used by the server-side admin client) may consume.
revoke all on function public.consume_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

notify pgrst, 'reload schema';

commit;
