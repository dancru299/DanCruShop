# DanCruShop

Digital product shop for DanCru: storefront, cart, buyer dashboard, admin CMS,
course delivery, protected downloads, Lemon Squeezy checkout, VietQR manual
orders, Supabase Auth/DB/Storage, and Resend purchase emails.
this is a Next.js e-commerce application with Supabase, using TypeScript and Tailwind CSS. The project has a well-organized structure with actions, components, and various features like courses, bundles, coupons, and more.


## Tech Stack

- Next.js App Router, React, TypeScript
- Supabase SSR, Postgres, Auth, Storage, RLS
- Lemon Squeezy webhook fulfillment
- VietQR manual order approval
- Tailwind CSS and shadcn-style components
- Vitest for unit tests

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Run `supabase/schema.sql` in the Supabase SQL editor for a fresh database.
Keep real secret values only in `.env.local` or the hosting provider's secret
manager.

## Quality Gates

```bash
npm run lint
npm test
npm run build
```

The production build uses the local `.env.local` file when run on this machine.
Before deploy, verify the production environment has its own Supabase, payment,
webhook, VietQR, support email, and email variables configured.

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to client
  code or committed.
- Lemon Squeezy webhooks must use `LEMONSQUEEZY_WEBHOOK_SECRET`.
- Product files are served through signed URLs from
  `/api/products/[identifier]/download`.
- Download logging uses the service-role client and a restricted RPC in
  `supabase/schema.sql`.

See [docs/production-checklist.md](docs/production-checklist.md) before a real
launch.
