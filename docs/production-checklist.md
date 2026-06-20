# Production Checklist

Use this before deploying DanCruShop to a real domain.

## Secrets And Env

- Rotate `SUPABASE_SERVICE_ROLE_KEY` if it was ever pasted into chat, logs,
  screenshots, or a public machine.
- Keep `.env.local` local only. Commit `.env.example`, not real values.
- Configure production secrets in the hosting provider, not in source control.
- Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS origin.
- Set `NEXT_PUBLIC_SUPPORT_EMAIL` to the beta support inbox shown in the UI.
- Verify `LEMONSQUEEZY_WEBHOOK_SECRET`, `LEMONSQUEEZY_API_KEY`, and
  `LEMONSQUEEZY_STORE_ID` are production values.
- Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for purchase access emails.

## Supabase

- For a fresh project, run every file in `supabase/migrations/` in numeric order
  against the production project (see `supabase/README.md`).
- For an existing project, run `supabase/migrations/0003_beta_launch_readiness.sql`
  once to add favorites and analytics without replaying the full schema.
- Confirm RLS is enabled on product, order, purchase, review, course, and
  download, favorites, and analytics tables.
- Confirm `public.increment_download_count(uuid)` is executable only by
  `service_role`.
- Keep product download files in a private storage bucket.
- Keep media assets public only when they are meant to be visible on the site.

## Payments And Fulfillment

- Test Lemon Squeezy webhook signature verification with a real webhook secret.
- Test duplicate webhook delivery and confirm it does not create duplicate
  orders or purchases.
- Test refund events and confirm purchase access is revoked.
- Test VietQR manual approval with a pending order and a buyer account.
- Confirm purchase emails generate a valid magic link to `/dashboard`.

## Runtime Hardening

- Apply `supabase/migrations/0006_rate_limits.sql` so `lib/rate-limit.ts::enforceRateLimit`
  shares limits across serverless instances via the `consume_rate_limit`
  Postgres function. Without it the limiter fails back to per-process memory.
- Add monitoring for webhook failures, email failures, and download failures.
- Add an alert when an order is paid but purchase unlock fails.
- Confirm `/api/analytics` records page views, product views, cart adds,
  checkout starts, and download events in `public.analytics_events`.
- Keep `npm audit` visible in CI and review moderate advisories before release.

## Quality Gates

Run these before deployment:

```bash
npm run lint
npm test
npm run build
```

Recommended next tests:

- Lemon Squeezy webhook payload parsing and idempotency.
- VietQR approval unlock flow.
- Protected download access for free, paid, unauthorized, and over-limit users.
- Admin-only mutations for products, files, courses, reviews, and orders.
- Policy/support links from footer, product pages, cart, and checkout success.
