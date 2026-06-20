-- DanCruShop: optional "original" price per product. When set, the storefront
-- shows it struck through next to the live price plus a computed discount badge
-- (e.g. -43%) on product cards and the Flash Sale section. Null = no discount.
--
-- Backs lib/supabase/queries/products.ts (compare_at_price_cents). Run in the
-- Supabase SQL Editor AFTER schema.sql. Safe to re-run.

begin;

alter table public.products
  add column if not exists compare_at_price_cents integer;

-- A meaningful "original" price is always strictly above the current price, so
-- the computed discount percentage can never be zero or negative.
alter table public.products
  drop constraint if exists products_compare_at_price_check;
alter table public.products
  add constraint products_compare_at_price_check
  check (
    compare_at_price_cents is null
    or compare_at_price_cents > price_cents
  );

notify pgrst, 'reload schema';

commit;
