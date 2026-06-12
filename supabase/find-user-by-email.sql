-- DanCruShop: resolve an auth user id by email without paginating the Admin API.
-- Backs lib/payments/fulfillment.ts. GoTrue stores normalized (lower-cased)
-- emails and indexes auth.users.email, so this resolves in a single indexed
-- lookup instead of scanning up to 20 pages of users on every fulfillment.

begin;

create or replace function public.find_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id
  from auth.users
  where email = lower(trim(p_email))
  order by created_at asc
  limit 1;
$$;

-- Only the service role (server-side admin client) may resolve emails to ids.
revoke all on function public.find_user_id_by_email(text) from public;
grant execute on function public.find_user_id_by_email(text) to service_role;

notify pgrst, 'reload schema';

commit;
