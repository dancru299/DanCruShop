-- Allow PayPal as an order provider.
-- PayPal is the international card/PayPal checkout (non-VND); VietQR stays the
-- VND method and Lemon Squeezy is no longer an integrated checkout provider.

alter table public.orders
  drop constraint if exists orders_provider_check;

alter table public.orders
  add constraint orders_provider_check
  check (provider in ('lemon_squeezy', 'vietqr', 'vietqr_manual', 'paypal'));
