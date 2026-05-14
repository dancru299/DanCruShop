# DanCruShop Next.js Folder Structure

Blueprint for the DanCruShop MVP app using Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth/Database/Storage, Lemon Squeezy, VietQR manual transfer, and Resend.

This structure intentionally stays inside the MVP boundaries from the PRD: creator-owned digital product shop, public shop/blog, buyer dashboard, admin CMS, payment unlock, and protected downloads. It does not add marketplace, subscription, community, certificate, quiz, or full LMS complexity.

## Recommended Tree

```text
DanCruShop/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       └── not-found.tsx
│   │   └── blog/
│   │       ├── page.tsx
│   │       └── [slug]/
│   │           ├── page.tsx
│   │           └── not-found.tsx
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── auth/
│   │       ├── callback/
│   │       │   └── route.ts
│   │       └── confirm/
│   │           └── route.ts
│   ├── (shop)/
│   │   ├── checkout/
│   │   │   ├── page.tsx
│   │   │   ├── success/
│   │   │   │   └── page.tsx
│   │   │   └── cancel/
│   │   │       └── page.tsx
│   │   └── vietqr/
│   │       └── [orderId]/
│   │           └── page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [productId]/
│   │   │   │       └── page.tsx
│   │   │   ├── orders/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── products/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       ├── edit/
│   │       │       │   └── page.tsx
│   │       │       └── files/
│   │       │           └── page.tsx
│   │       ├── orders/
│   │       │   └── page.tsx
│   │       ├── customers/
│   │       │   └── page.tsx
│   │       ├── purchases/
│   │       │   └── page.tsx
│   │       ├── blog/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       └── edit/
│   │       │           └── page.tsx
│   │       └── settings/
│   │           └── page.tsx
│   ├── api/
│   │   ├── products/
│   │   │   ├── route.ts
│   │   │   └── [identifier]/
│   │   │       ├── route.ts
│   │   │       └── download/
│   │   │           └── route.ts
│   │   ├── me/
│   │   │   └── purchases/
│   │   │       └── route.ts
│   │   ├── checkout/
│   │   │   └── route.ts
│   │   ├── vietqr/
│   │   │   ├── orders/
│   │   │   │   └── route.ts
│   │   │   └── approve/
│   │   │       └── route.ts
│   │   ├── webhooks/
│   │   │   └── lemon-squeezy/
│   │   │       └── route.ts
│   │   └── admin/
│   │       ├── products/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── files/
│   │       │           └── route.ts
│   │       ├── orders/
│   │       │   └── route.ts
│   │       └── blog/
│   │           ├── route.ts
│   │           └── [id]/
│   │               └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── actions/
│   ├── auth.actions.ts
│   ├── checkout.actions.ts
│   ├── profile.actions.ts
│   ├── product.actions.ts
│   ├── product-file.actions.ts
│   ├── purchase.actions.ts
│   ├── order.actions.ts
│   ├── blog.actions.ts
│   └── admin.actions.ts
├── components/
│   ├── ui/
│   │   └── .gitkeep
│   ├── shared/
│   │   ├── app-logo.tsx
│   │   ├── site-header.tsx
│   │   ├── site-footer.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── empty-state.tsx
│   │   └── pagination.tsx
│   ├── products/
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-filters.tsx
│   │   ├── product-price.tsx
│   │   ├── product-detail.tsx
│   │   └── download-button.tsx
│   ├── checkout/
│   │   ├── checkout-button.tsx
│   │   ├── payment-method-selector.tsx
│   │   └── vietqr-panel.tsx
│   ├── dashboard/
│   │   ├── dashboard-shell.tsx
│   │   ├── dashboard-sidebar.tsx
│   │   ├── purchased-product-card.tsx
│   │   └── order-history-table.tsx
│   ├── admin/
│   │   ├── admin-shell.tsx
│   │   ├── admin-sidebar.tsx
│   │   ├── product-form.tsx
│   │   ├── product-file-manager.tsx
│   │   ├── blog-post-form.tsx
│   │   ├── orders-table.tsx
│   │   └── manual-approval-panel.tsx
│   ├── blog/
│   │   ├── blog-card.tsx
│   │   ├── blog-list.tsx
│   │   └── mdx-content.tsx
│   └── auth/
│       ├── login-form.tsx
│       ├── register-form.tsx
│       └── magic-link-form.tsx
├── config/
│   ├── site.ts
│   ├── navigation.ts
│   └── product.ts
├── emails/
│   ├── purchase-success.tsx
│   ├── magic-login-link.tsx
│   ├── download-ready.tsx
│   ├── refund-notice.tsx
│   └── admin-manual-approval.tsx
├── hooks/
│   ├── use-debounce.ts
│   ├── use-media-query.ts
│   └── use-toast.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   ├── admin.ts
│   │   ├── storage.ts
│   │   └── queries/
│   │       ├── products.ts
│   │       ├── purchases.ts
│   │       ├── orders.ts
│   │       ├── profiles.ts
│   │       └── blog.ts
│   ├── payments/
│   │   ├── lemon-squeezy.ts
│   │   ├── lemon-squeezy-webhook.ts
│   │   └── vietqr.ts
│   ├── email/
│   │   ├── resend.ts
│   │   └── send-email.ts
│   ├── auth/
│   │   ├── require-user.ts
│   │   ├── require-admin.ts
│   │   └── roles.ts
│   ├── analytics/
│   │   └── events.ts
│   ├── validators/
│   │   ├── checkout.schema.ts
│   │   ├── product.schema.ts
│   │   ├── profile.schema.ts
│   │   └── blog.schema.ts
│   ├── constants.ts
│   ├── env.ts
│   ├── slug.ts
│   ├── format.ts
│   └── utils.ts
├── types/
│   ├── database.types.ts
│   ├── product.ts
│   ├── purchase.ts
│   ├── order.ts
│   ├── profile.ts
│   ├── blog.ts
│   ├── payment.ts
│   └── api.ts
├── content/
│   └── .gitkeep
├── public/
│   ├── images/
│   └── og/
├── supabase/
│   ├── schema.sql
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── middleware.ts
├── components.json
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

## Routing Notes

Route groups keep URL paths clean while separating concerns:

- `app/(marketing)` serves `/`, `/products`, `/products/[slug]`, `/blog`, and `/blog/[slug]`.
- `app/(auth)` serves login/register and Supabase email/OAuth callbacks.
- `app/(shop)` serves checkout result pages and the VietQR manual payment page.
- `app/(dashboard)/dashboard` is protected customer space.
- `app/(dashboard)/admin` is protected admin space.
- `app/api` contains Route Handlers matching PRD Section 10.

`middleware.ts` belongs at the project root. It should call `lib/supabase/middleware.ts` to refresh the Supabase Auth session and redirect protected paths:

- `/dashboard/:path*` requires an authenticated user.
- `/admin/:path*` requires an authenticated admin profile.
- `/login` should redirect authenticated users to `/dashboard` by default.

## API Route Handler Mapping

```text
GET    /api/products                         app/api/products/route.ts
GET    /api/products/:slug                   app/api/products/[identifier]/route.ts
GET    /api/me/purchases                     app/api/me/purchases/route.ts
POST   /api/products/:id/download            app/api/products/[identifier]/download/route.ts
POST   /api/checkout                         app/api/checkout/route.ts
POST   /api/webhooks/lemon-squeezy           app/api/webhooks/lemon-squeezy/route.ts
POST   /api/admin/products                   app/api/admin/products/route.ts
PATCH  /api/admin/products/:id               app/api/admin/products/[id]/route.ts
DELETE /api/admin/products/:id               app/api/admin/products/[id]/route.ts
POST   /api/admin/products/:id/files         app/api/admin/products/[id]/files/route.ts
GET    /api/admin/orders                     app/api/admin/orders/route.ts
POST   /api/admin/blog                       app/api/admin/blog/route.ts
PATCH  /api/admin/blog/:id                   app/api/admin/blog/[id]/route.ts
```

VietQR support from PRD Section 22.3 adds MVP-specific handlers:

```text
POST   /api/vietqr/orders                    app/api/vietqr/orders/route.ts
POST   /api/vietqr/approve                   app/api/vietqr/approve/route.ts
```

`app/api/products/[identifier]` is intentionally shared because Next.js treats `[slug]` and `[id]` as the same dynamic segment under `/api/products`. In the detail `GET`, `identifier` is interpreted as a product slug; in the download `POST`, it is interpreted as a product id.

## Module Responsibilities

- `actions/`: Server Actions for form submissions and mutations used by React pages.
- `components/ui/`: shadcn/ui generated source components only.
- `components/shared/`: shell and reusable layout components that are not business-domain-specific.
- `components/products`, `components/dashboard`, `components/admin`, `components/blog`, `components/auth`: domain-specific React components.
- `lib/supabase/client.ts`: browser Supabase client.
- `lib/supabase/server.ts`: server component/action/route handler Supabase client using cookies.
- `lib/supabase/middleware.ts`: session refresh helper for root `middleware.ts`.
- `lib/supabase/admin.ts`: service-role client for webhook/admin-only server code. Never import from client components.
- `lib/supabase/storage.ts`: private bucket helpers and signed download URL generation.
- `lib/supabase/queries/`: server-side read models for products, purchases, orders, profiles, and blog posts.
- `lib/payments/`: Lemon Squeezy checkout/webhook verification and VietQR manual order helpers.
- `lib/email/` and `emails/`: Resend sender wrapper plus React email templates for PRD Section 22.7 events.
- `lib/auth/`: `requireUser`, `requireAdmin`, and role helpers used by layouts, actions, and Route Handlers.
- `lib/validators/`: Zod schemas for API payloads and forms.
- `types/database.types.ts`: generated Supabase types from the SQL schema.
- `types/*.ts`: stable app-facing TypeScript interfaces and API response types.

## Server/Client Boundary Rules

- Default to Server Components for pages and data-heavy UI.
- Add `"use client"` only for forms, filters, menus, upload controls, interactive checkout choices, and dashboard/admin widgets that need browser state.
- Keep service role usage isolated to `lib/supabase/admin.ts`, webhooks, and admin-only server operations.
- Use Route Handlers for third-party callbacks, signed downloads, checkout creation, and endpoints consumed outside React Server Actions.
- Use Server Actions for first-party form submissions inside the app, especially admin product/blog CRUD and profile updates.
- Keep product file paths off the client. Client receives a signed URL only after `/api/products/:id/download` validates active purchase access.

## Naming Conventions

- Database tables/columns: `snake_case`.
- Route folders: lowercase and kebab-case where needed.
- React components: `PascalCase` exports in kebab-case filenames.
- TypeScript variables/functions: `camelCase`.
- Server Actions: verb-first names such as `createProduct`, `updateProfile`, `approveVietQrOrder`.
- Route Handler functions: `GET`, `POST`, `PATCH`, `DELETE`.

## MVP Guardrails

- Course folders exist only for simple product expansion and preview/purchased lesson access.
- No marketplace seller modules.
- No subscription billing modules.
- No coupon, affiliate, community, certificate, quiz, or advanced analytics folders.
- Internal analytics is limited to `lib/analytics/events.ts` for PRD Section 22.8 MVP events.
