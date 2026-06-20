# Supabase database

SQL for the DanCruShop database, split by purpose. Migrations are applied by
hand in the Supabase SQL editor (this project does not use the Supabase CLI),
so the numeric prefix **is** the run order.

```
supabase/
  migrations/   Schema changes (DDL + functions + RLS). Run in numeric order.
  seeds/        Sample/reference data. Run after migrations.
  scripts/      One-off manual operations. Run only when you need them.
```

## Fresh database

Run every file in `migrations/` in ascending numeric order (0001 → 0017) in the
Supabase SQL editor, then optionally apply the seeds:

| Step | Files |
| --- | --- |
| 1. Schema | `migrations/0001_initial_schema.sql` … `migrations/0017_easter_egg_discount.sql`, in order |
| 2. Categories | `seeds/01_categories.sql` |
| 3. Demo content (optional) | `seeds/02_mock_data.sql` |

The migrations are ordered the way they were originally applied, so the
dependencies hold — e.g. `0015_product_stats_and_tech_icons.sql` creates the
`tech_icons` tables that `0016_drop_tech_icons.sql` later archives and drops.

## Adding a migration

Create the next file as `migrations/NNNN_short_description.sql` (zero-padded,
one higher than the current max). Keep it **idempotent and re-runnable** so a
re-applied migration is a no-op — the existing files use `create table if not
exists`, `drop policy if exists … create policy …`, and guarded `alter table`
blocks. Never edit a migration that has already been applied to a real database;
add a new one instead.

## Seeds

- `seeds/01_categories.sql` — the product categories the storefront expects.
- `seeds/02_mock_data.sql` — demo products, profiles, reviews, and orders for
  local development. Do **not** run this against production.

## Scripts

- `scripts/set-admin-password.sql` — promotes a specific account to admin by
  inserting an `auth.identities` row. One-off; edit the email/password before
  running.

See [../docs/production-checklist.md](../docs/production-checklist.md) before a
real launch.
