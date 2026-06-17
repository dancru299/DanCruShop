// Mock data for the iMac workspace showcase section (full-bleed band below the
// hero). Ported from the static HTML/CSS prototype in `packaged_showcase/`.
//
// UI/UX-first: hardcoded so we can iterate on the showcase without a backend.
// Each product carries its own accent palette — switching products transitions
// the dashboard screenshot AND the accent lighting in real time, so the colors
// are intentional data, not theme tokens. Replace with real data later (e.g. a
// CMS-curated "featured" list); keep the shape so the component does not change.

import { formatProductPrice } from "@/lib/products/display";
import type { SpotlightProduct } from "@/lib/supabase/queries/spotlight";

export type ShowcaseProduct = {
  id: string;
  /** Full product name, shown in the selector card. */
  name: string;
  /** Short brand label, shown in the floating price tag. */
  brand: string;
  /** Pre-formatted price label, e.g. "$35.50" or "860.000 ₫". */
  priceLabel: string;
  /** Average review score as a string, e.g. "4.7". */
  rating: string;
  /** Dashboard screenshot shown on the warped iMac screen (public path). */
  dashboardImg: string;
  /** Link to the product detail page. */
  href: string;
  /** Accent hex — drives the active card, glow, and price color. */
  accent: string;
  /** Darker accent hex for gradients. */
  accentDark: string;
  /** Soft accent tint hex, used for the rating chip background. */
  soft: string;
  /** Accent-on-light text hex for the active price label. */
  text: string;
};

export const productShowcaseProducts: ShowcaseProduct[] = [
  {
    id: "laravel-tall-saas-starter",
    name: "Laravel TALL SaaS Starter",
    brand: "LaraSaaS",
    priceLabel: "$15.00",
    rating: "4.9",
    dashboardImg: "/showcase/dashboard_larasaas.png",
    href: "/products",
    accent: "#6366f1",
    accentDark: "#4338ca",
    soft: "#eef2ff",
    text: "#4f46e5",
  },
  {
    id: "filament-advanced-admin",
    name: "Filament Advanced Admin Panel",
    brand: "Filament",
    priceLabel: "$15.00",
    rating: "4.8",
    dashboardImg: "/showcase/dashboard_filament.png",
    href: "/products",
    accent: "#f59e0b",
    accentDark: "#d97706",
    soft: "#fff7ed",
    text: "#b45309",
  },
  {
    id: "tall-multi-vendor",
    name: "TALL Stack Multi-Vendor E-Platform",
    brand: "TALLMart",
    priceLabel: "$35.50",
    rating: "4.7",
    dashboardImg: "/showcase/dashboard_tallmart.png",
    href: "/products",
    accent: "#10b981",
    accentDark: "#059669",
    soft: "#ecfdf5",
    text: "#047857",
  },
];

// Accent palettes cycled across the showcase cards. Real products don't carry
// brand colors, so we assign one per slot to keep the lighting transitions
// distinct. First three match the original prototype order.
const SHOWCASE_PALETTES = [
  { accent: "#6366f1", accentDark: "#4338ca", soft: "#eef2ff", text: "#4f46e5" },
  { accent: "#f59e0b", accentDark: "#d97706", soft: "#fff7ed", text: "#b45309" },
  { accent: "#10b981", accentDark: "#059669", soft: "#ecfdf5", text: "#047857" },
  { accent: "#ec4899", accentDark: "#db2777", soft: "#fdf2f8", text: "#be185d" },
  { accent: "#0ea5e9", accentDark: "#0284c7", soft: "#f0f9ff", text: "#0369a1" },
  { accent: "#8b5cf6", accentDark: "#7c3aed", soft: "#f5f3ff", text: "#6d28d9" },
] as const;

// Used when a product has no thumbnail to warp onto the iMac screen.
const SHOWCASE_FALLBACK_IMAGES = [
  "/showcase/dashboard_larasaas.png",
  "/showcase/dashboard_filament.png",
  "/showcase/dashboard_tallmart.png",
] as const;

// Map auto-ranked spotlight products into the showcase shape. Returns an empty
// array when there is nothing to show, so callers can fall back to
// `productShowcaseProducts`. Capped at 6 to keep the selector readable.
export function buildShowcaseProducts(
  products: SpotlightProduct[]
): ShowcaseProduct[] {
  return products.slice(0, 6).map((product, index) => {
    const palette = SHOWCASE_PALETTES[index % SHOWCASE_PALETTES.length];

    return {
      id: product.id,
      name: product.title,
      brand: product.title,
      priceLabel: formatProductPrice(product),
      rating: (Number(product.rating_average) || 0).toFixed(1),
      dashboardImg:
        product.thumbnail_url ??
        SHOWCASE_FALLBACK_IMAGES[index % SHOWCASE_FALLBACK_IMAGES.length],
      href: `/products/${product.slug}`,
      accent: palette.accent,
      accentDark: palette.accentDark,
      soft: palette.soft,
      text: palette.text,
    };
  });
}
