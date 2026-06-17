// Mock data for the hero spotlight slider (right side of the split hero).
//
// UI/UX-first: these cards are hardcoded so we can iterate on the slider design
// without a backend. Replace `heroSpotlightCards` with real data later (e.g. a
// CMS-curated list or a "featured" flag on products) — keep the shape so the
// component does not change.
//
// `rating`, `downloads` and `icons` are NEW fields that do not exist on the
// product model yet. When the backend lands:
//   - rating    -> average review score
//   - downloads -> number of sales / downloads
//   - icons     -> tech-stack badges; the user will upload real icon assets and
//                  fill in `src`. Until then we render the `label` initials.

import { formatProductPrice, productTypeLabels } from "@/lib/products/display";
import type { SpotlightProduct } from "@/lib/supabase/queries/spotlight";

export type HeroSpotlightIcon = {
  /** Short name, e.g. "Laravel". Used for the tooltip + placeholder initials. */
  label: string;
  /** Uploaded icon asset (public path or URL). Optional until icons are added. */
  src?: string;
};

export type HeroSpotlightCard = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Product type label, e.g. "Template". */
  typeLabel: string;
  /** Delivery label, e.g. "Giao ngay". */
  deliveryLabel: string;
  /** Pre-formatted price label, e.g. "$20.00". */
  priceLabel: string;
  /** Average review score, 0–5. */
  rating: number;
  /** Number of downloads / sales. */
  downloads: number;
  /** Link to the product detail page. */
  href: string;
  /** Tech-stack icons. User will upload real assets and set `src`. */
  icons: HeroSpotlightIcon[];
  /** Optional thumbnail; falls back to a gradient artwork when missing. */
  thumbnailUrl?: string;
};

// Max 5 cards. Logic for which products appear here is decided later.
export const heroSpotlightCards: HeroSpotlightCard[] = [
  {
    id: "laravel-tall-saas-starter",
    eyebrow: "Gợi ý trong tuần",
    title: "Laravel TALL Stack SaaS Starter + Filament",
    description:
      "Bộ starter SaaS dựng sẵn cho người thuê — Auth, Billing, Admin panel.",
    typeLabel: "Template",
    deliveryLabel: "Giao ngay",
    priceLabel: "$20.00",
    rating: 4.9,
    downloads: 1200,
    href: "/products",
    icons: [
      { label: "Laravel" },
      { label: "Livewire" },
      { label: "Tailwind" },
      { label: "Filament" },
    ],
  },
  {
    id: "filament-admin-extensions",
    eyebrow: "Bán chạy",
    title: "Filament Advanced Admin Panel Extensions",
    description:
      "Bộ tiện ích mở rộng nâng cao cho Filament: widget, bảng, biểu mẫu phức tạp.",
    typeLabel: "Tool",
    deliveryLabel: "Giao ngay",
    priceLabel: "$15.00",
    rating: 4.8,
    downloads: 800,
    href: "/products",
    icons: [{ label: "Filament" }, { label: "Laravel" }, { label: "Tailwind" }],
  },
  {
    id: "tall-multi-vendor",
    eyebrow: "Mới cập nhật",
    title: "TALL Stack Multi-Vendor E-commerce Platform",
    description:
      "Nền tảng thương mại điện tử đa nhà bán dựng trên TALL stack, kèm dashboard.",
    typeLabel: "Template",
    deliveryLabel: "Giao ngay",
    priceLabel: "$35.00",
    rating: 4.9,
    downloads: 500,
    href: "/products",
    icons: [
      { label: "Laravel" },
      { label: "Livewire" },
      { label: "Alpine" },
      { label: "Tailwind" },
    ],
  },
  {
    id: "nextjs-commerce-kit",
    eyebrow: "Được yêu thích",
    title: "Next.js Commerce Kit + Supabase",
    description:
      "Bộ khởi tạo cửa hàng số: giỏ hàng, thanh toán, license và trang quản trị.",
    typeLabel: "Template",
    deliveryLabel: "Giao ngay",
    priceLabel: "$29.00",
    rating: 4.7,
    downloads: 640,
    href: "/products",
    icons: [
      { label: "Next.js" },
      { label: "React" },
      { label: "Supabase" },
      { label: "Tailwind" },
    ],
  },
  {
    id: "design-system-pro",
    eyebrow: "Combo tiết kiệm",
    title: "Design System Pro — UI Kit & Components",
    description:
      "Thư viện component và design token sẵn sàng cho sản phẩm thật, dark-mode aware.",
    typeLabel: "Bundle",
    deliveryLabel: "Giao ngay",
    priceLabel: "$45.00",
    rating: 5.0,
    downloads: 310,
    href: "/products",
    icons: [{ label: "Figma" }, { label: "React" }, { label: "Tailwind" }],
  },
];

// Pick an eyebrow label from a product's strongest signal within the spotlight
// set, so each card explains *why* it is featured (top seller, best rated...).
function heroEyebrow(
  product: SpotlightProduct,
  signals: { maxSales: number; maxRating: number; newestAt: number }
): string {
  if (product.sales_count > 0 && product.sales_count === signals.maxSales) {
    return "Bán chạy";
  }
  if (product.rating_count > 0 && product.rating_average === signals.maxRating) {
    return "Đánh giá cao";
  }
  if (new Date(product.created_at).getTime() === signals.newestAt) {
    return "Mới cập nhật";
  }
  return "Gợi ý cho bạn";
}

// Map the auto-ranked spotlight products into the card shape the slider renders.
// Returns an empty array when there is nothing to show, so callers can fall back
// to `heroSpotlightCards`.
export function buildHeroSpotlightCards(
  products: SpotlightProduct[]
): HeroSpotlightCard[] {
  const top = products.slice(0, 5);

  if (top.length === 0) {
    return [];
  }

  const signals = {
    maxSales: Math.max(...top.map((p) => p.sales_count)),
    maxRating: Math.max(
      ...top.map((p) => (p.rating_count > 0 ? p.rating_average : 0))
    ),
    newestAt: Math.max(...top.map((p) => new Date(p.created_at).getTime())),
  };

  return top.map((product) => ({
    id: product.id,
    eyebrow: heroEyebrow(product, signals),
    title: product.title,
    description: product.short_description ?? "",
    typeLabel: productTypeLabels[product.product_type],
    deliveryLabel: product.is_free ? "Nhận miễn phí" : "Giao ngay",
    priceLabel: formatProductPrice(product),
    rating: product.rating_average,
    downloads: product.sales_count,
    href: `/products/${product.slug}`,
    icons: product.tech_icons.map((icon) => ({
      label: icon.label,
      src: icon.icon_url ?? undefined,
    })),
    thumbnailUrl: product.thumbnail_url ?? undefined,
  }));
}
