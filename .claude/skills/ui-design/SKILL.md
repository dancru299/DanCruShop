---
name: ui-design
description: Use when building or editing any UI page/component in DanCruShop (admin CMS pages, storefront pages, forms, tables). Defines the project's layout patterns, shared primitives, and styling conventions so new screens match the existing design. Trigger whenever the task involves creating an admin list/detail/form page, a storefront section, or restyling existing UI.
---

# DanCruShop UI Design System

Next.js (App Router) + Tailwind v4 + shadcn-style primitives in `components/ui/`.
Reference template for admin: `app/(dashboard)/admin/products/`.

## Copy language (split by audience)

- **Admin** (`app/(dashboard)/admin/**`, admin forms/tables, admin-only messages such as the
  GitHub repo "check connection" result) → **Vietnamese**.
- **Everything else** — customer-facing storefront (`app/(marketing)/**`, `app/(shop)/**`,
  `app/(auth)/**`, product/compare/cart pages, emails, toasts shown to shoppers) → **English**.

Never ship mixed-language customer UI. For config shared between admin and storefront
(e.g. `lib/products/specs.ts`), keep the Vietnamese `label` for the admin form and add an
English `labelEn` that customer-facing components consume. Match `Intl` locales too
(`en-US` for customer-facing dates).

## Golden rules

1. **Reuse primitives first.** Never re-implement a header, metric card, search box,
   action menu, table, field, button, or badge — import the shared ones below.
2. **List pages = server; interactivity = client.** The page (server component) fetches
   data and renders header + metrics, then delegates the searchable table to a `*-table.tsx`
   client component. Create/edit live on **separate routes**, not inline forms.
3. **Row actions go in a popup**, never inline buttons in the cell. Use `AdminActionMenu`.
4. Match spacing/tokens exactly (see Styling). When unsure, copy the products page.

## Shared primitives (components/admin/)

| Import | Use |
| --- | --- |
| `AdminPageHeader` | Page title block: `eyebrow`, `title`, `description`, optional `action` (the primary button). |
| `AdminMetric` | One stat card `{ label, value }`. Put 3–4 in a `grid gap-3 sm:grid-cols-3 xl:grid-cols-4`. |
| `AdminSearchInput` | Controlled local search box `{ value, onChange, placeholder }`. Top of every table. |
| `AdminActionMenu` + `AdminActionMenuLink` / `AdminActionMenuButton` | The `⋯` popup. Links navigate (edit/view); Buttons run mutations. `tone="destructive"` for delete/revoke. Icons: `pencil, trash, external-link, paperclip, bundle, key, ban, restore, loader`. |

From `components/ui/`: `Table*`, `Field`/`FieldLabel`/`FieldDescription`/`FieldError`,
`Input`, `Textarea`, `Select*`, `Button`, `Badge`. Toasts via `sonner` (`toast.success/error`).

## Pattern A — Admin list page

Server page (`app/(dashboard)/admin/<entity>/page.tsx`):

```tsx
export const dynamic = "force-dynamic";
export default async function Page() {
  const rows = await getAdmin<Entity>();
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader eyebrow="…" title="…" description="…"
        action={<Button render={<Link href="/admin/<entity>/new" />} nativeButton={false}>
          <PlusIcon data-icon="inline-start" />Mới</Button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminMetric label="…" value={rows.length} />…
      </div>
      <EntityTable rows={rows} />
    </div>
  );
}
```

Client table (`components/admin/<entity>-table.tsx`, `"use client"`):
`useState` query → `useMemo` filtered → `<AdminSearchInput/>` + card with header
(`{filtered}/{total} đang hiển thị`) + `<Table>` + per-row `<AdminActionMenu>`.
Mutations use `useTransition` + `router.refresh()`; destructive ones `window.confirm` first.
Always include an empty state (icon tile + message) covering both "no data" and "no match".

Canonical examples: `products-table.tsx`, `category-table.tsx`, `coupon-table.tsx`, `license-table.tsx`.

## Pattern B — Admin create/edit form page

Routes `…/new/page.tsx` and `…/[id]/edit/page.tsx` (edit fetches by id, `notFound()` if missing)
render one shared `*-form.tsx` client component with `mode: "create" | "edit"`.
Form layout: ghost back-link + `h1` title → `max-w-2xl` card of `<Field>`s → footer
`border-t pt-5 sm:justify-end` with Cancel (outline link) + Submit (with `Loader2Icon` spinner
while `isPending`). On success: `toast.success` → `router.push("/admin/<entity>")` → `router.refresh()`.
Slugs: `slugify` from `lib/utils`; auto-generate from name until the slug field is touched.
Examples: `category-form.tsx`, `coupon-form.tsx`, `product-form.tsx`.

Single-config pages (e.g. Settings) skip the list/table and just render `AdminPageHeader` + a form.

## Pattern C — Storefront

Product detail `app/(marketing)/products/[slug]/page.tsx` is the reference: hero with
`rounded-lg border bg-card/60 backdrop-blur-xl` panels, sticky aside CTA, full-width
`max-w-6xl` sections separated by `border-b`. Product grids use `<ProductCard>` in
`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3`. Storefront search/filter uses
URL params (`ProductSearchBar`, `searchPublishedProducts`), unlike admin's local filter.

## Styling conventions

- Page wrapper: `flex flex-col gap-6`. Section card: `rounded-lg border bg-card p-5 text-card-foreground shadow-sm`.
- Title `text-3xl font-semibold tracking-normal`; section heading `text-base font-semibold`; muted copy `text-sm leading-6 text-muted-foreground`.
- Tokens only: `bg-card`, `bg-muted`, `text-muted-foreground`, `border`, `primary`, `destructive`. No raw hex. Dark-mode aware (`dark:` where needed).
- Toggle switch: a `button` with `h-6 w-11 rounded-full` track + `size-4` knob translating `translate-x-5`/`translate-x-0`; `aria-pressed`.
- Icons: `lucide-react`, `aria-hidden="true"`, `data-icon="inline-start"` inside buttons.
- Badge variants: `default` (published/active), `secondary` (draft/off), `outline` (archived/neutral).
- Container width: admin uses the layout's `max-w-8xl`; storefront sections `max-w-6xl`.
- **Admin shell has no top header** — navigation is the `AdminSidebar` only (vertical on
  desktop, horizontal scroll on mobile), with a "Về cửa hàng" link back to storefront. Do
  not add the storefront `SiteHeader` to admin pages. Storefront/customer pages keep `SiteHeader`.

## Checklist before finishing UI work

- [ ] Reused shared primitives (no duplicated header/metric/search/menu).
- [ ] List page has search at top + metrics + action-menu popup; create/edit on own routes.
- [ ] Empty state + loading (`isPending`) handled; toasts on mutation result.
- [ ] Copy language matches audience (admin = Vietnamese, storefront = English); tokens not hex; matches products page spacing.
- [ ] `npx tsc --noEmit` (ignore `RepoTemplate/`) and `npx eslint` clean. Do **not** run `next dev`.
