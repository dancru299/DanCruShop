-- DanCruShop: retire the DB-backed tech-icon library.
--
-- The tech stack now lives entirely in products.metadata.specs (see
-- lib/products/specs.ts). This migration drops the obsolete tech_icons /
-- product_tech_icons tables created in product-stats-and-tech-icons.sql.
--
-- !! RUN THE BACKFILL FIRST !!
--   npx tsx scripts/backfill-specs-from-tech.ts
-- That script copies tech_icons + metadata.tech_stack into metadata.specs and
-- removes the obsolete tech_stack field. This file refuses to drop anything
-- until that backfill has run.
--
-- Run in the Supabase SQL Editor. Wrapped in a transaction, guarded, and
-- re-runnable (safe to run again after the tables are gone).

begin;

-- ---------------------------------------------------------------------------
-- 1. Safety guard: abort if the backfill has not been run.
--
-- The backfill deletes metadata.tech_stack from every product. If any product
-- still carries that key, the migration never ran — so dropping the source
-- tables now would lose the only copy of that data. Raise instead, which rolls
-- back the whole transaction.
-- ---------------------------------------------------------------------------

do $$
declare
  pending_count integer;
begin
  -- Nothing to verify if the source tables are already gone (re-run case).
  if to_regclass('public.product_tech_icons') is null
     and to_regclass('public.tech_icons') is null then
    raise notice 'Tech-icon tables already dropped — skipping safety check.';
    return;
  end if;

  select count(*)
  into pending_count
  from public.products
  where (metadata::jsonb) ? 'tech_stack';

  if pending_count > 0 then
    raise exception
      'Aborting: % product(s) still have metadata.tech_stack. Run "npx tsx scripts/backfill-specs-from-tech.ts" before dropping the tech-icon tables.',
      pending_count;
  end if;

  raise notice 'Safety check passed: no product still references metadata.tech_stack.';
end $$;

-- ---------------------------------------------------------------------------
-- 2. Archive the tables before dropping them.
--
-- Keeps a recoverable copy (public._archived_*) in case the backfill missed an
-- edge case. Drop these archive tables manually once you are confident:
--   drop table if exists public._archived_product_tech_icons;
--   drop table if exists public._archived_tech_icons;
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.tech_icons') is not null then
    execute 'create table if not exists public._archived_tech_icons as '
         || 'select * from public.tech_icons';
  end if;

  if to_regclass('public.product_tech_icons') is not null then
    execute 'create table if not exists public._archived_product_tech_icons as '
         || 'select * from public.product_tech_icons';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Drop the obsolete tables.
--
-- CASCADE removes the attached RLS policies, indexes, FKs and the
-- set_tech_icons_updated_at trigger. Order child-then-parent for clarity;
-- CASCADE would handle either order. The shared set_updated_at() function is
-- left in place — it is used by other tables.
-- ---------------------------------------------------------------------------

drop table if exists public.product_tech_icons cascade;
drop table if exists public.tech_icons cascade;

-- Tell PostgREST to forget the dropped tables.
notify pgrst, 'reload schema';

commit;
