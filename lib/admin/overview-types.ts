import type { BlogPostStatus } from "@/lib/supabase/queries/blog";
import type { OrderProvider, OrderStatus } from "@/lib/supabase/queries/orders";
import type { ProductStatus, ProductType } from "@/lib/supabase/queries/products";

export type ProductRow = {
  id: string;
  title: string;
  slug: string;
  product_type: ProductType;
  status: ProductStatus;
  price_cents: number;
  currency: string;
  is_free: boolean;
  created_at: string;
};

export type OrderRow = {
  id: string;
  email: string;
  provider: OrderProvider;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  created_at: string;
};

export type OrderItemRow = {
  order_id: string;
  product_id: string;
  price_cents: number;
  quantity: number;
};

export type PurchaseRow = {
  id: string;
  product_id: string;
  order_id: string | null;
  access_status: "active" | "revoked" | "refunded" | "expired";
  purchased_at: string;
};

export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  status: BlogPostStatus;
  published_at: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  role: "customer" | "admin";
  created_at: string;
};

export type AnalyticsEventRow = {
  anonymous_id: string | null;
  created_at: string;
  event_name: string;
  order_id: string | null;
  path: string | null;
  product_id: string | null;
  user_id: string | null;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type TopProduct = {
  id: string;
  title: string;
  slug: string;
  units: number;
  revenueCents: number;
};

export type TopBuyer = {
  email: string;
  orders: number;
  revenueCents: number;
};

export type ActivityItem = {
  label: string;
  meta: string;
  timestamp: string;
  tone: Tone;
};

export type BetaFunnel = {
  addToCart: number;
  checkoutStarts: number;
  downloadStarts: number;
  pageViews: number;
  productViews: number;
  uniqueVisitors: number;
};

export type Tone = "amber" | "emerald" | "rose" | "sky" | "violet";
