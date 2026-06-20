-- DanCruShop: give product categories an explicit display order plus an optional
-- icon (lucide icon name) and image, so the admin can arrange them and the
-- homepage "Danh mục" section can render real categories visually.
--
-- Backs lib/supabase/queries/categories.ts and the home categories section.
-- Safe to re-run.

begin;

alter table public.product_categories
  add column if not exists position integer not null default 0;

alter table public.product_categories
  add column if not exists icon text;

alter table public.product_categories
  add column if not exists image_url text;

-- Backfill position from the current alphabetical order for existing rows so the
-- initial arrangement is stable and deterministic.
with ordered as (
  select id, row_number() over (order by name asc) - 1 as rn
  from public.product_categories
)
update public.product_categories as c
set position = ordered.rn
from ordered
where ordered.id = c.id
  and c.position = 0;

create index if not exists product_categories_position_idx
  on public.product_categories (position asc);

notify pgrst, 'reload schema';

commit;
