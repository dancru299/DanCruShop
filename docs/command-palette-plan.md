# Plan: Global Command Palette (Cmd/Ctrl + K)

> Trạng thái: **Đề xuất / chưa thực thi**
> Phạm vi: Hộp lệnh kiểu terminal (Raycast/Linear/VS Code) cho storefront DanCruShop.
> Đối tượng: dev — ưu tiên thao tác bàn phím, đồng bộ thương hiệu terminal/IDE sẵn có.

## Mục lục
- [0. Nguyên tắc thiết kế](#0-nguyên-tắc-thiết-kế)
- [1. Hạ tầng sẵn có (đã khảo sát)](#1-hạ-tầng-sẵn-có-đã-khảo-sát)
- [2. Phase 1 — MVP](#2-phase-1--mvp)
- [3. Phase 2 — Easter eggs](#3-phase-2--easter-eggs)
- [4. Thứ tự triển khai & checklist file](#4-thứ-tự-triển-khai--checklist-file)
- [5. Rủi ro & edge cases](#5-rủi-ro--edge-cases)
- [6. Tiêu chí hoàn thành](#6-tiêu-chí-hoàn-thành)

---

## 0. Nguyên tắc thiết kế
- **Tận dụng tối đa hạ tầng sẵn có** — không dựng lại search, theme, cart. Palette chỉ là tầng UI điều phối.
- **Client component nhẹ; data lấy qua Server Action** — không lộ Supabase client ra trình duyệt.
- **Tách 2 giai đoạn**: MVP an toàn trước; `sudo discount` (rủi ro margin) làm riêng ở Phase 2 với backend cẩn thận.
- **Tuân thủ skill `ui-design`** + quy ước storefront tiếng Anh (admin tiếng Việt).
- **Không hard-code màu** — dùng CSS variable theme để chạy đúng cả light/dark.

---

## 1. Hạ tầng sẵn có (đã khảo sát)

| Thành phần | Vị trí | Ghi chú |
|---|---|---|
| Full-text product search | `lib/supabase/queries/products.ts:309` `searchPublishedProducts()` | Postgres `search_vector`, trả `title, slug, price_cents, currency, is_free, thumbnail_url, product_type` |
| Điểm mount toàn cục | `app/layout.tsx` | Chuỗi `CartProvider → FavoritesProvider → CompareProvider` + `<CompareBar/>` |
| Cart hook | `components/cart/cart-provider.tsx` | `useCart()` → `{ itemCount, items, addItem, ... }` |
| Favorites hook | `components/favorites/favorites-provider.tsx` | `useFavorites()` → `{ toggleFavorite, isFavorite, ... }` |
| Compare hook | `components/compare/compare-provider.tsx` | `useCompare()` |
| Theme | `components/theme-provider.tsx` (next-themes) | `attribute="class"`, light/dark, `enableSystem={false}` |
| Coupon backend | `actions/coupon.actions.ts`, `lib/payments/coupons.ts` | `applyCouponToCart()`, `createCoupon()` |
| Rate limit | `lib/rate-limit.ts`, `supabase/rate-limits.sql` | Dùng cho easter egg |
| Mono font | `app/globals.css` `--font-mono` (Geist Mono) | Cho prompt terminal |
| Dialog primitive | `components/ui/dialog.tsx` (Radix) | cmdk sẽ đặt lên trên |
| Analytics | `trackAnalyticsEvent()` | Đo mức dùng |

**Cần thêm**: package `cmdk` (chưa cài).

---

## 2. Phase 1 — MVP

### 2.1 Dependencies
```bash
npm install cmdk
```
`cmdk` lo sẵn: lọc/sắp xếp, điều hướng ⬆️⬇️, `aria` roles, Enter để chọn. Đặt trên Radix Dialog đã có.

### 2.2 Data layer

**a) Server Action product search** — file mới `actions/search.actions.ts`:
```ts
"use server";
// Gọi searchPublishedProducts({ query, perPage: 6 })
// Map → { id, title, slug, priceLabel, type, thumbnail_url }
// Dùng formatter giá hiện có (lib/utils + getProductDiscount như compare-matrix)
export async function searchProductsForPalette(query: string): Promise<PaletteProduct[]>
```
- Trả tối đa ~6 kết quả, giá đã format sẵn (client không tính toán).
- Guard: `query.trim().length < 2` → trả `[]`.

**b) Static command registry** — file mới `lib/command-palette/commands.ts`:
```ts
export type PaletteCommand = {
  id: string;
  label: string;          // "Go to cart"
  hint?: string;          // "/cart"
  keywords: string[];     // ["cart", "checkout"]
  icon: LucideIcon;
  perform: (ctx: PaletteActionContext) => void;
  group: "Navigation" | "Actions" | "Theme";
};
```
Lệnh điều hướng (bám đúng routes thật trong `app/`):

| Lệnh | Hành động |
|---|---|
| `/products` | `router.push("/products")` |
| `/cart` | `/cart` + badge `useCart().itemCount` |
| `/favorites` | `/favorites` |
| `/compare` | `/compare` |
| `/blog`, `/support`, `/profile`, `/settings` | điều hướng tương ứng |
| `/theme` | `useTheme().setTheme(theme === "dark" ? "light" : "dark")` |
| `/login` hoặc `/dashboard` | tùy trạng thái đăng nhập (prop từ server) |

`PaletteActionContext = { router, setTheme, theme, closePalette }`.

### 2.3 Component breakdown (files mới)
```
components/command-palette/
├─ command-palette.tsx          # Client. State open/query, render CommandDialog
├─ command-palette-provider.tsx # Mount + global hotkey listener + context mở/đóng
├─ palette-product-item.tsx     # 1 dòng kết quả sản phẩm (thumb, title, giá)
├─ palette-prompt.tsx           # Header "$ dancru-shop >" + caret nhấp nháy
└─ use-palette-search.ts        # hook: debounce 200ms + gọi searchProductsForPalette
```

- **`command-palette-provider.tsx`**:
  - `useEffect` đăng ký `keydown`: bắt `(e.metaKey || e.ctrlKey) && e.key === "k"` → `e.preventDefault()` (chặn Ctrl+K focus address bar Firefox) → `setOpen(true)`.
  - Context `openPalette()` để nút khác (ô search header, FAB mobile) gọi mở.
- **`command-palette.tsx`**:
  - `<CommandDialog>` (Radix Dialog + cmdk).
  - Trên cùng: `<PalettePrompt/>` hiển thị `$ dancru-shop >` + input.
  - Groups: **Products** (động) → **Navigation** → **Theme**.
  - Empty state: "Type to search products, or try /cart, /theme…".
  - Footer hint: `↑↓ to navigate · ↵ to select · esc to close`.

### 2.4 Mount toàn cục
Sửa `app/layout.tsx`:
```tsx
<CompareProvider>
  <CommandPaletteProvider>
    {children}
    <CompareBar />
    <CommandPalette />
    <Toaster ... />
  </CommandPaletteProvider>
</CompareProvider>
```

### 2.5 Entry points (ngoài hotkey)
- **Header**: nút search giả lập ô `⌘K` (kiểu Vercel) gọi `openPalette()`. Phát hiện OS để hiện `⌘K` (Mac) hay `Ctrl K` (Win) qua `navigator.platform`.
- **Mobile**: nút mở palette nhưng UX fallback full-screen search; nav chính bằng tap.

### 2.6 Styling (terminal + glassmorphism)
- `font-mono` (Geist Mono) cho prompt + lệnh.
- Glass: `bg-background/70 backdrop-blur-xl border border-border/60 shadow-2xl` — dùng CSS variable theme.
- Caret nhấp nháy: `@keyframes blink` trong `globals.css`.
- Prompt: `text-emerald-400` cho `$`, `text-muted-foreground` cho path.

### 2.7 Accessibility
- Radix Dialog lo focus-trap, ESC, scroll-lock, `aria-modal`.
- Input `aria-label="Command palette"`; cmdk tự gắn `role="listbox"/"option"` + `aria-selected`.
- Kiểm tra contrast trên nền glass ở cả 2 theme.

### 2.8 Analytics
Tái dùng `trackAnalyticsEvent`: bắn `command_palette_open`, `command_palette_navigate`, `command_palette_product_select`.

### 2.9 Tests
- `tests/unit/command-palette.test.ts`: test filter `commands.ts` theo keywords + mapping `searchProductsForPalette` (mock). Theo pattern `tests/unit/access-control.test.ts`.

---

## 3. Phase 2 — Easter eggs

### 3.1 `help` (không rủi ro)
- Gõ `help` → render khối ASCII art + danh sách lệnh ngầm.
- In thêm vào DevTools console qua `console.log("%c...", style)` — lớp easter egg cho dev mở F12.

### 3.2 `sudo discount` — thiết kế AN TOÀN

> ⚠️ **Không** in mã 10% cố định. Mã cố định lan truyền = giảm giá vĩnh viễn toàn site → ăn margin.

**Bước 0 — xác minh schema** `supabase/coupons.sql` (`code, type, value, max_uses, used_count, expires_at, metadata...`) trước khi code.

**Backend** — file mới `actions/easter-egg.actions.ts`:
```ts
"use server";
export async function claimDevDiscount(): Promise<
  | { ok: true; code: string; expiresAt: string }
  | { ok: false; reason: "rate_limited" | "already_claimed" | "budget_exhausted" }
>
```
Chống lạm dụng nhiều lớp:
1. **Rate limit** qua `lib/rate-limit.ts` + `supabase/rate-limits.sql` — vd 1 lần / IP / ngày.
2. **One-per-user**: đã đăng nhập → lưu claim theo `user_id`, chặn claim lần 2.
3. **Mã động single-use**: tạo coupon mới mỗi lần — `code = "DEVMODE-" + nanoid(6)`, `type=percent`, `value=10`, `max_uses=1`, `expires_at = now()+48h`, `metadata={ source: "easter_egg", user_id }`.
4. **Trần ngân sách**: tổng coupon easter-egg vượt ngưỡng N (cấu hình `store-settings`) → `budget_exhausted`.

**Migration mới** `supabase/easter-egg-discount.sql` (phong cách an toàn như `drop-tech-icons.sql`): bảng `easter_egg_claims` (user_id/ip, code, created_at) + RLS + index; transaction-wrapped.

**Client**: gõ `sudo discount` → `claimDevDiscount()` → render rocket ASCII + mã + nút "Copy" + auto-apply vào cart qua `applyCouponToCart`.

---

## 4. Thứ tự triển khai & checklist file

| Bước | File | Loại |
|---|---|---|
| 1 | `npm i cmdk` | dep |
| 2 | `actions/search.actions.ts` | mới |
| 3 | `lib/command-palette/commands.ts` | mới |
| 4 | `components/command-palette/*` (5 file) | mới |
| 5 | `app/layout.tsx` (mount) | sửa |
| 6 | header entry button + `app/globals.css` (caret blink) | sửa |
| 7 | `tests/unit/command-palette.test.ts` | mới |
| — | **— mốc demo MVP —** | — |
| 8 | `help` + console art | mới |
| 9 | đọc `coupons.sql` → `actions/easter-egg.actions.ts` + `supabase/easter-egg-discount.sql` | mới |
| 10 | `sudo discount` UI + rate-limit | mới/sửa |

---

## 5. Rủi ro & edge cases
- **Ctrl+K nuốt phím trình duyệt** → `preventDefault`.
- **Gõ phím khi đang ở input khác** (vd ô search admin) → chỉ chặn khi không trong field, hoặc luôn mở (chốt lúc làm).
- **SSR/hydration theme** → next-themes đã `suppressHydrationWarning`; nút theme render sau mount để tránh lệch.
- **Search spam** → debounce 200ms + min 2 ký tự + giới hạn 6 kết quả.
- **Coupon abuse** → xử lý ở §3.2.

---

## 6. Tiêu chí hoàn thành
**Phase 1:**
- [ ] Cmd/Ctrl+K mở palette mọi trang storefront; ESC/click-ngoài đóng.
- [ ] Gõ ≥2 ký tự → hiện sản phẩm kèm giá; Enter mở trang sản phẩm.
- [ ] `/cart` `/favorites` `/compare` `/products` `/theme` hoạt động bằng bàn phím.
- [ ] Điều hướng ⬆️⬇️ + Enter; đúng a11y; đẹp ở cả light/dark.
- [ ] Có entry button ở header; mobile fallback dùng được.
- [ ] Unit test xanh.

**Phase 2:**
- [ ] `help` hiện ASCII art (+ console).
- [ ] `sudo discount` phát mã **động, single-use, hết hạn, rate-limited**; auto-apply vào cart.
- [ ] Migration `easter-egg-discount.sql` chạy an toàn (transaction + `if exists`).
