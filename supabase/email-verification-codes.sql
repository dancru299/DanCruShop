-- DanCruShop: short-lived email verification codes for sign-up activation and
-- password reset. Codes are generated and emailed by the app (via Resend), never
-- by Supabase Auth, so we control length (6 digits), expiry and attempt limits.
--
-- Backs lib/auth/verification-code.ts. Only the service-role admin client reads
-- or writes this table (RLS enabled, no public policies).

begin;

create table if not exists public.email_verification_codes (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  code_hash   text        not null,
  purpose     text        not null,
  expires_at  timestamptz not null,
  attempts    integer     not null default 0,
  consumed_at timestamptz,
  created_at  timestamptz not null default now(),
  constraint email_verification_codes_purpose_check
    check (purpose in ('signup', 'password_reset'))
);

-- Latest active code per (email, purpose) is the common lookup.
create index if not exists email_verification_codes_email_purpose_idx
  on public.email_verification_codes (email, purpose, created_at desc);

alter table public.email_verification_codes enable row level security;

-- No policies: the table is reachable only through the service-role admin client,
-- which bypasses RLS. The anon/auth roles must never touch verification codes.
revoke all on public.email_verification_codes from anon, authenticated;

commit;
