-- DanCruShop: atomic paid-order fulfillment.
-- Backs lib/payments/lemon-squeezy-webhook.ts. Writes the order, its items, and
-- the buyer's purchases in a single transaction so a mid-way failure can never
-- leave an order without its purchases (previously three separate round-trips).

begin;

create or replace function public.fulfill_paid_order(
  p_provider_order_id text,
  p_email text,
  p_currency text,
  p_total_cents integer,
  p_user_id uuid,
  p_raw_payload jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  insert into public.orders as o (
    provider,
    provider_order_id,
    email,
    currency,
    total_cents,
    status,
    user_id,
    raw_payload
  )
  values (
    'lemon_squeezy',
    p_provider_order_id,
    p_email,
    p_currency,
    p_total_cents,
    'paid',
    p_user_id,
    p_raw_payload
  )
  on conflict (provider_order_id) do update
    set
      email = excluded.email,
      currency = excluded.currency,
      total_cents = excluded.total_cents,
      status = 'paid',
      user_id = excluded.user_id,
      raw_payload = excluded.raw_payload,
      updated_at = now()
  returning o.id into v_order_id;

  -- Rebuild the order's items so re-delivered webhooks stay consistent.
  delete from public.order_items where order_id = v_order_id;

  insert into public.order_items (order_id, product_id, price_cents, quantity)
  select
    v_order_id,
    (item->>'product_id')::uuid,
    (item->>'price_cents')::integer,
    coalesce((item->>'quantity')::integer, 1)
  from jsonb_array_elements(p_items) as item;

  insert into public.purchases (user_id, product_id, order_id, access_status)
  select
    p_user_id,
    (item->>'product_id')::uuid,
    v_order_id,
    'active'
  from jsonb_array_elements(p_items) as item
  on conflict (user_id, product_id) do update
    set
      access_status = 'active',
      order_id = excluded.order_id;

  return v_order_id;
end;
$$;

-- Only the service role (server-side webhook handler) may fulfill orders.
revoke all on function public.fulfill_paid_order(
  text, text, text, integer, uuid, jsonb, jsonb
) from public;
grant execute on function public.fulfill_paid_order(
  text, text, text, integer, uuid, jsonb, jsonb
) to service_role;

notify pgrst, 'reload schema';

commit;
