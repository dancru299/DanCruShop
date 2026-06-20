import Link from "next/link";
import type { ReactNode } from "react";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  CircleDollarSignIcon,
  Clock3Icon,
  FileTextIcon,
  GaugeIcon,
  MessageSquareIcon,
  PackageIcon,
  PlusIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminMetric } from "@/components/admin/admin-metric";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireAdmin } from "@/lib/auth/roles";
import {
  getSupabaseErrorDetails,
  isMissingSupabaseTable,
} from "@/lib/supabase/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BlogPostStatus } from "@/lib/supabase/queries/blog";
import type {
  OrderProvider,
  OrderStatus,
} from "@/lib/supabase/queries/orders";
import type {
  ProductStatus,
  ProductType,
} from "@/lib/supabase/queries/products";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type ProductRow = {
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

type OrderRow = {
  id: string;
  email: string;
  provider: OrderProvider;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  created_at: string;
};

type OrderItemRow = {
  order_id: string;
  product_id: string;
  price_cents: number;
  quantity: number;
};

type PurchaseRow = {
  id: string;
  product_id: string;
  order_id: string | null;
  access_status: "active" | "revoked" | "refunded" | "expired";
  purchased_at: string;
};

type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  status: BlogPostStatus;
  published_at: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  role: "customer" | "admin";
  created_at: string;
};

type AnalyticsEventRow = {
  anonymous_id: string | null;
  created_at: string;
  event_name: string;
  order_id: string | null;
  path: string | null;
  product_id: string | null;
  user_id: string | null;
};

type TrendPoint = {
  label: string;
  value: number;
};

type TopProduct = {
  id: string;
  title: string;
  slug: string;
  units: number;
  revenueCents: number;
};

type TopBuyer = {
  email: string;
  orders: number;
  revenueCents: number;
};

type ActivityItem = {
  label: string;
  meta: string;
  timestamp: string;
  tone: Tone;
};

type BetaFunnel = {
  addToCart: number;
  checkoutStarts: number;
  downloadStarts: number;
  pageViews: number;
  productViews: number;
  uniqueVisitors: number;
};

type Tone = "amber" | "emerald" | "rose" | "sky" | "violet";

const dotClasses: Record<Tone, string> = {
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  rose: "bg-rose-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
};

const toneHex: Record<Tone, string> = {
  amber: "#fbbf24",
  emerald: "#34d399",
  rose: "#fb7185",
  sky: "#38bdf8",
  violet: "#a78bfa",
};

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLastDays(days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    return new Date(today.getTime() - (days - 1 - index) * MS_PER_DAY);
  });
}

function isWithinDays(value: string, days: number) {
  return new Date(value).getTime() >= Date.now() - days * MS_PER_DAY;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function normalizeCurrency(currency: string | null | undefined) {
  return currency?.trim().toUpperCase() || "USD";
}

function getCurrencyAmount(cents: number, currency: string) {
  return currency === "VND" ? cents : cents / 100;
}

function formatMoney(cents: number, currency: string) {
  const normalizedCurrency = normalizeCurrency(currency);

  return new Intl.NumberFormat(normalizedCurrency === "VND" ? "vi-VN" : "en-US", {
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "VND" ? 0 : 2,
    style: "currency",
  }).format(getCurrencyAmount(cents, normalizedCurrency));
}

function formatCompactMoney(cents: number, currency: string) {
  const normalizedCurrency = normalizeCurrency(currency);

  return new Intl.NumberFormat(normalizedCurrency === "VND" ? "vi-VN" : "en-US", {
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "VND" ? 0 : 1,
    notation: "compact",
    style: "currency",
  }).format(getCurrencyAmount(cents, normalizedCurrency));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getTrendLabel(current: number, previous: number, formatter = formatNumber) {
  if (previous === 0 && current === 0) {
    return "No movement yet";
  }

  if (previous === 0) {
    return `+${formatter(current)} vs previous 7d`;
  }

  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? "+" : "";

  return `${sign}${delta.toFixed(0)}% vs previous 7d`;
}

function getPrimaryCurrency(orders: OrderRow[]) {
  const totals = new Map<string, number>();

  orders.forEach((order) => {
    const currency = normalizeCurrency(order.currency);
    totals.set(currency, (totals.get(currency) ?? 0) + order.total_cents);
  });

  return (
    [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD"
  );
}

function sumOrdersInCurrency(orders: OrderRow[], currency: string) {
  return orders.reduce((total, order) => {
    return normalizeCurrency(order.currency) === currency
      ? total + order.total_cents
      : total;
  }, 0);
}

function buildDailyTrend(
  days: Date[],
  rows: Array<{ created_at: string; value: number }>
): TrendPoint[] {
  const totals = new Map(days.map((date) => [getDateKey(date), 0]));

  rows.forEach((row) => {
    const key = getDateKey(new Date(row.created_at));

    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + row.value);
    }
  });

  return days.map((date) => ({
    label: formatDayLabel(date),
    value: totals.get(getDateKey(date)) ?? 0,
  }));
}

function countEvents(events: AnalyticsEventRow[], eventName: string) {
  return events.filter((event) => event.event_name === eventName).length;
}

function getUniqueVisitorCount(events: AnalyticsEventRow[]) {
  const visitors = new Set<string>();

  events.forEach((event) => {
    const visitorId = event.user_id ?? event.anonymous_id;

    if (visitorId) {
      visitors.add(visitorId);
    }
  });

  return visitors.size;
}

function getBetaFunnel(events: AnalyticsEventRow[]): BetaFunnel {
  return {
    addToCart: countEvents(events, "add_to_cart"),
    checkoutStarts: countEvents(events, "checkout_start"),
    downloadStarts: countEvents(events, "download_start"),
    pageViews: countEvents(events, "page_view"),
    productViews: countEvents(events, "product_view"),
    uniqueVisitors: getUniqueVisitorCount(
      events.filter((event) => event.event_name === "page_view")
    ),
  };
}

async function getAdminOverviewData() {
  await requireAdmin();

  const supabaseAdmin = createAdminClient();

  const [
    productsResult,
    ordersResult,
    orderItemsResult,
    purchasesResult,
    postsResult,
    profilesResult,
    analyticsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select(
        "id,title,slug,product_type,status,price_cents,currency,is_free,created_at"
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("orders")
      .select("id,email,provider,status,total_cents,currency,created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("order_items")
      .select("order_id,product_id,price_cents,quantity"),
    supabaseAdmin
      .from("purchases")
      .select("id,product_id,order_id,access_status,purchased_at")
      .order("purchased_at", { ascending: false }),
    supabaseAdmin
      .from("blog_posts")
      .select("id,title,slug,status,published_at,created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id,role,created_at"),
    supabaseAdmin
      .from("analytics_events")
      .select(
        "event_name,anonymous_id,user_id,product_id,order_id,path,created_at"
      )
      .gte("created_at", new Date(Date.now() - 14 * MS_PER_DAY).toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const results = [
    ["products", productsResult.error],
    ["orders", ordersResult.error],
    ["order_items", orderItemsResult.error],
    ["purchases", purchasesResult.error],
    ["blog_posts", postsResult.error],
    ["profiles", profilesResult.error],
  ] as const;

  results.forEach(([label, error]) => {
    if (error) {
      console.error(`Failed to fetch admin overview ${label}`, error);
    }
  });

  if (analyticsResult.error) {
    if (isMissingSupabaseTable(analyticsResult.error, "analytics_events")) {
      console.warn(
        "Admin analytics funnel is unavailable until analytics_events is deployed.",
        getSupabaseErrorDetails(analyticsResult.error)
      );
    } else {
      console.error(
        "Failed to fetch admin overview analytics_events",
        analyticsResult.error
      );
    }
  }

  const products = (productsResult.data ?? []) as ProductRow[];
  const orders = (ordersResult.data ?? []) as OrderRow[];
  const orderItems = (orderItemsResult.data ?? []) as OrderItemRow[];
  const purchases = (purchasesResult.data ?? []) as PurchaseRow[];
  const posts = (postsResult.data ?? []) as BlogPostRow[];
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const analyticsEvents = (analyticsResult.data ?? []) as AnalyticsEventRow[];
  const current7AnalyticsEvents = analyticsEvents.filter((event) =>
    isWithinDays(event.created_at, 7)
  );
  const betaFunnel = getBetaFunnel(current7AnalyticsEvents);
  const paidOrders = orders.filter((order) => order.status === "paid");
  const primaryCurrency = getPrimaryCurrency(paidOrders);
  const days = getLastDays(14);
  const paidOrderById = new Map(paidOrders.map((order) => [order.id, order]));
  const productById = new Map(products.map((product) => [product.id, product]));

  const current7PaidOrders = paidOrders.filter((order) =>
    isWithinDays(order.created_at, 7)
  );
  const current7Orders = orders.filter((order) => isWithinDays(order.created_at, 7));
  const previous7Start = Date.now() - 14 * MS_PER_DAY;
  const previous7End = Date.now() - 7 * MS_PER_DAY;
  const previous7PaidOrders = paidOrders.filter((order) => {
    const time = new Date(order.created_at).getTime();

    return time >= previous7Start && time < previous7End;
  });
  const previous7Orders = orders.filter((order) => {
    const time = new Date(order.created_at).getTime();

    return time >= previous7Start && time < previous7End;
  });

  const topProductMap = new Map<string, TopProduct>();

  orderItems.forEach((item) => {
    const order = paidOrderById.get(item.order_id);

    if (!order) {
      return;
    }

    const product = productById.get(item.product_id);
    const current = topProductMap.get(item.product_id) ?? {
      id: item.product_id,
      revenueCents: 0,
      slug: product?.slug ?? item.product_id,
      title: product?.title ?? "Unknown product",
      units: 0,
    };

    current.units += item.quantity;

    if (normalizeCurrency(order.currency) === primaryCurrency) {
      current.revenueCents += item.price_cents * item.quantity;
    }

    topProductMap.set(item.product_id, current);
  });

  const topProducts = [...topProductMap.values()]
    .sort((a, b) => b.units - a.units || b.revenueCents - a.revenueCents)
    .slice(0, 5);

  const topBuyerMap = new Map<string, TopBuyer>();

  paidOrders.forEach((order) => {
    const email = order.email.toLowerCase();
    const current = topBuyerMap.get(email) ?? {
      email,
      orders: 0,
      revenueCents: 0,
    };

    current.orders += 1;

    if (normalizeCurrency(order.currency) === primaryCurrency) {
      current.revenueCents += order.total_cents;
    }

    topBuyerMap.set(email, current);
  });

  const topBuyers = [...topBuyerMap.values()]
    .sort((a, b) => b.revenueCents - a.revenueCents || b.orders - a.orders)
    .slice(0, 5);

  const revenueTrend = buildDailyTrend(
    days,
    paidOrders
      .filter((order) => normalizeCurrency(order.currency) === primaryCurrency)
      .map((order) => ({
        created_at: order.created_at,
        value: order.total_cents,
      }))
  );

  const analyticsTrend = buildDailyTrend(
    days,
    analyticsEvents
      .filter((event) => event.event_name === "page_view")
      .map((event) => ({
        created_at: event.created_at,
        value: 1,
      }))
  );

  const activities: ActivityItem[] = [
    ...orders.slice(0, 5).map((order) => ({
      label: order.status === "paid" ? "Đơn đã thanh toán" : "Hoạt động đơn hàng",
      meta: `${order.email} - ${formatMoney(order.total_cents, order.currency)}`,
      timestamp: order.created_at,
      tone:
        order.status === "paid"
          ? ("emerald" as const)
          : order.status === "pending"
            ? ("amber" as const)
            : ("rose" as const),
    })),
    ...products.slice(0, 4).map((product) => ({
      label:
        product.status === "published" ? "Sản phẩm đã đăng" : "Sản phẩm bản nháp",
      meta: product.title,
      timestamp: product.created_at,
      tone: product.status === "published" ? ("sky" as const) : ("violet" as const),
    })),
    ...posts.slice(0, 4).map((post) => ({
      label: post.status === "published" ? "Bài viết đã đăng" : "Bài viết bản nháp",
      meta: post.title,
      timestamp: post.published_at ?? post.created_at,
      tone: post.status === "published" ? ("emerald" as const) : ("violet" as const),
    })),
  ]
    .sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 8);

  return {
    activePurchases: purchases.filter(
      (purchase) => purchase.access_status === "active"
    ).length,
    activity: activities,
    analyticsTrend,
    archivedProducts: products.filter((product) => product.status === "archived")
      .length,
    betaFunnel,
    customers: profiles.filter((profile) => profile.role === "customer").length,
    draftPosts: posts.filter((post) => post.status === "draft").length,
    draftProducts: products.filter((product) => product.status === "draft").length,
    failedOrders: orders.filter(
      (order) => order.status === "failed" || order.status === "cancelled"
    ).length,
    newCustomers7d: profiles.filter((profile) => isWithinDays(profile.created_at, 7))
      .length,
    orders,
    orders7d: current7Orders.length,
    paidOrders,
    pendingOrders: orders.filter((order) => order.status === "pending").length,
    posts,
    previous7RevenueCents: sumOrdersInCurrency(
      previous7PaidOrders,
      primaryCurrency
    ),
    previousOrders7d: previous7Orders.length,
    primaryCurrency,
    publishedPosts: posts.filter((post) => post.status === "published").length,
    publishedProducts: products.filter(
      (product) => product.status === "published"
    ).length,
    recentPosts: posts
      .filter((post) => post.status === "published")
      .sort(
        (a, b) =>
          new Date(b.published_at ?? b.created_at).getTime() -
          new Date(a.published_at ?? a.created_at).getTime()
      )
      .slice(0, 5),
    refundedOrders: orders.filter((order) => order.status === "refunded").length,
    revenueTrend,
    topBuyers,
    topProducts,
    totalProducts: products.length,
    totalRevenueCents: sumOrdersInCurrency(paidOrders, primaryCurrency),
    totalRevenueCents7d: sumOrdersInCurrency(current7PaidOrders, primaryCurrency),
  };
}

function getLineChartPaths(points: TrendPoint[]) {
  const width = 560;
  const height = 190;
  const paddingX = 14;
  const paddingY = 16;
  const max = Math.max(1, ...points.map((point) => point.value));
  const step =
    points.length > 1 ? (width - paddingX * 2) / (points.length - 1) : 0;
  const baseline = height - paddingY;
  const coords = points.map((point, index) => {
    const x = paddingX + index * step;
    const y =
      baseline - (point.value / max) * (height - paddingY * 2 - 10);

    return { x, y };
  });
  const linePath = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`)
    .join(" ");
  const first = coords[0] ?? { x: paddingX, y: baseline };
  const last = coords[coords.length - 1] ?? { x: width - paddingX, y: baseline };
  const areaPath = `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;

  return { areaPath, baseline, coords, height, linePath, width };
}



function LineChart({
  emptyLabel,
  formatter,
  gradientId,
  points,
  tone,
}: {
  emptyLabel: string;
  formatter: (value: number) => string;
  gradientId: string;
  points: TrendPoint[];
  tone: Tone;
}) {
  const { areaPath, baseline, coords, height, linePath, width } =
    getLineChartPaths(points);
  const hasData = points.some((point) => point.value > 0);
  const chartColor = toneHex[tone];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-56 overflow-hidden rounded-lg border bg-background/60">
        <svg
          aria-label="Revenue trend chart"
          className="h-full w-full"
          preserveAspectRatio="none"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.34" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="text-border">
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                stroke="currentColor"
                strokeDasharray="4 8"
                strokeWidth="1"
                x1="0"
                x2={width}
                y1={height * ratio}
                y2={height * ratio}
              />
            ))}
          </g>
          {hasData ? (
            <>
              <path
                d={areaPath}
                fill={`url(#${gradientId})`}
              />
              <path
                d={linePath}
                fill="none"
                stroke={chartColor}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              {coords.map((coord, index) => (
                <circle
                  key={`${points[index]?.label}-${index}`}
                  cx={coord.x}
                  cy={coord.y}
                  fill={chartColor}
                  r={index === coords.length - 1 ? "4" : "2.5"}
                />
              ))}
            </>
          ) : (
            <>
              <line
                className="text-muted-foreground/40"
                stroke="currentColor"
                strokeDasharray="6 8"
                strokeWidth="2"
                x1="16"
                x2={width - 16}
                y1={baseline}
                y2={baseline}
              />
              <text
                className="fill-muted-foreground"
                fontSize="13"
                textAnchor="middle"
                x={width / 2}
                y={height / 2}
              >
                {emptyLabel}
              </text>
            </>
          )}
        </svg>
      </div>
      <div className="grid grid-cols-3 text-xs text-muted-foreground">
        <span>{points[0]?.label}</span>
        <span className="text-center">
          {formatter(Math.max(...points.map((point) => point.value), 0))} peak
        </span>
        <span className="text-right">{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function MiniBars({
  points,
  tone,
}: {
  points: TrendPoint[];
  tone: Tone;
}) {
  const max = Math.max(1, ...points.map((point) => point.value));

  return (
    <div className="flex h-24 items-end gap-1.5">
      {points.map((point, index) => {
        const height = Math.max(8, (point.value / max) * 100);

        return (
          <div
            key={`${point.label}-${index}`}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div className="flex h-20 w-full items-end rounded-sm bg-muted/40">
              <div
                className={cn("w-full rounded-sm", dotClasses[tone])}
                style={{ height: `${height}%` }}
                title={`${point.label}: ${formatNumber(point.value)}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankedList({
  currency,
  emptyLabel,
  items,
  maxValue,
  type,
}: {
  currency: string;
  emptyLabel: string;
  items: Array<TopProduct | TopBuyer>;
  maxValue: number;
  type: "buyers" | "products";
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((item, index) => {
        const value = "units" in item ? item.units : item.revenueCents;
        const progress = Math.max(6, (value / Math.max(maxValue, 1)) * 100);
        const title = "title" in item ? item.title : item.email;
        const meta =
          type === "products" && "units" in item
            ? `${formatNumber(item.units)} sold - ${formatCompactMoney(
                item.revenueCents,
                currency
              )}`
            : "orders" in item
              ? `${formatNumber(item.orders)} orders - ${formatCompactMoney(
                  item.revenueCents,
                  currency
                )}`
              : "";

        return (
          <div
            key={title}
            className="grid gap-3 border-b py-3 last:border-b-0 sm:grid-cols-[2rem_1fr_auto]"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
              {index + 1}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{title}</p>
                {"slug" in item ? (
                  <Link
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    href={`/admin/products/${item.id}/edit`}
                  >
                    <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
                  </Link>
                ) : null}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground sm:text-right">{meta}</p>
          </div>
        );
      })}
    </div>
  );
}

function Panel({
  action,
  children,
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-normal">{title}</h2>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function CoverageRow({
  description,
  label,
  status,
  tone,
}: {
  description: string;
  label: string;
  status: string;
  tone: Tone;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className={cn("mt-1 size-2 rounded-full", dotClasses[tone])} />
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Badge variant="outline">{status}</Badge>
    </div>
  );
}

function FunnelRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{formatNumber(value)}</span>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const data = await getAdminOverviewData();
  const currentRevenue = data.totalRevenueCents7d;
  const previousRevenue = data.previous7RevenueCents;
  const maxProductUnits = Math.max(
    1,
    ...data.topProducts.map((product) => product.units)
  );
  const maxBuyerRevenue = Math.max(
    1,
    ...data.topBuyers.map((buyer) => buyer.revenueCents)
  );

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
        <PlusIcon aria-hidden="true" data-icon="inline-start" />
        Sản phẩm mới
      </Button>
      <Button
        variant="outline"
        render={<Link href="/admin/orders" />}
        nativeButton={false}
      >
        <ReceiptTextIcon aria-hidden="true" data-icon="inline-start" />
        Đơn hàng
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Trung tâm chỉ huy Admin"
        title="Tổng quan DanCruShop"
        description="Theo dõi doanh số, dòng tiền, trạng thái sản phẩm, hoạt động của khách hàng, bài viết blog và các số liệu phân tích."
        action={headerActions}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          description={`${getTrendLabel(currentRevenue, previousRevenue, (value) =>
            formatCompactMoney(value, data.primaryCurrency)
          )}`}
          Icon={CircleDollarSignIcon}
          label="Doanh thu"
          tone="emerald"
          value={formatCompactMoney(data.totalRevenueCents, data.primaryCurrency)}
        />
        <AdminMetric
          description={`${formatNumber(data.pendingOrders)} chờ duyệt, ${formatNumber(
            data.refundedOrders
          )} đã hoàn tiền`}
          Icon={ReceiptTextIcon}
          label="Đơn hàng"
          tone="sky"
          value={formatNumber(data.orders.length)}
        />
        <AdminMetric
          description={`${formatNumber(data.publishedProducts)} đã đăng, ${formatNumber(
            data.draftProducts
          )} bản nháp`}
          Icon={PackageIcon}
          label="Sản phẩm"
          tone="violet"
          value={formatNumber(data.totalProducts)}
        />
        <AdminMetric
          description={`${formatNumber(data.newCustomers7d)} khách mới trong 7 ngày`}
          Icon={UsersIcon}
          label="Khách hàng"
          tone="amber"
          value={formatNumber(data.customers)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel
          description="Chỉ hiển thị tiền tệ chính. Đơn hàng khác tiền tệ sẽ không xuất hiện tại đây."
          title="Xu hướng dòng tiền"
          action={<Badge variant="secondary">14 ngày qua</Badge>}
        >
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Doanh thu thực nhận</p>
              <p className="text-2xl font-semibold">
                {formatMoney(data.totalRevenueCents, data.primaryCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đơn đã thanh toán</p>
              <p className="text-2xl font-semibold">
                {formatNumber(data.paidOrders.length)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Giao dịch hoạt động</p>
              <p className="text-2xl font-semibold">
                {formatNumber(data.activePurchases)}
              </p>
            </div>
          </div>
          <LineChart
            emptyLabel="Không có đơn hàng nào được thanh toán trong khoảng thời gian này"
            formatter={(value) => formatCompactMoney(value, data.primaryCurrency)}
            gradientId="cashflowGradient"
            points={data.revenueTrend}
            tone="emerald"
          />
        </Panel>

        <Panel
          description="Sự kiện ẩn danh từ hệ thống trong 7 ngày gần nhất."
          title="Tín hiệu quan tâm"
          action={<GaugeIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Đơn trong 7 ngày</p>
                <p className="text-2xl font-semibold">
                  {formatNumber(data.orders7d)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getTrendLabel(data.orders7d, data.previousOrders7d)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Khách ghé thăm</p>
                <p className="text-2xl font-semibold">
                  {formatNumber(data.betaFunnel.uniqueVisitors)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(data.betaFunnel.pageViews)} lượt xem trang
                </p>
              </div>
            </div>
            <MiniBars points={data.analyticsTrend} tone="sky" />
            <div className="rounded-lg border p-3">
              <FunnelRow label="Lượt xem sản phẩm" value={data.betaFunnel.productViews} />
              <FunnelRow label="Thêm vào giỏ" value={data.betaFunnel.addToCart} />
              <FunnelRow
                label="Bắt đầu thanh toán"
                value={data.betaFunnel.checkoutStarts}
              />
              <FunnelRow label="Đơn đã thanh toán" value={data.paidOrders.length} />
              <FunnelRow
                label="Lượt tải tài nguyên"
                value={data.betaFunnel.downloadStarts}
              />
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          description="Xếp hạng dựa trên số lượng sản phẩm thực tế đã được bán."
          title="Top 5 sản phẩm bán chạy"
          action={<ShoppingBagIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <RankedList
            currency={data.primaryCurrency}
            emptyLabel="Chưa có sản phẩm nào được bán."
            items={data.topProducts}
            maxValue={maxProductUnits}
            type="products"
          />
        </Panel>

        <Panel
          description="Những khách hàng có tổng giá trị mua hàng cao nhất."
          title="Khách hàng tiêu biểu"
          action={<UserRoundIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <RankedList
            currency={data.primaryCurrency}
            emptyLabel="Chưa có khách mua hàng."
            items={data.topBuyers}
            maxValue={maxBuyerRevenue}
            type="buyers"
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel
          description="Sắp xếp theo các bài viết được xuất bản mới nhất."
          title="Radar bài viết"
          action={<FileTextIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Đã đăng</p>
              <p className="text-xl font-semibold">{formatNumber(data.publishedPosts)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nháp</p>
              <p className="text-xl font-semibold">{formatNumber(data.draftPosts)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lượt xem</p>
              <p className="text-xl font-semibold">--</p>
            </div>
          </div>
          <div className="flex flex-col">
            {data.recentPosts.length > 0 ? (
              data.recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(post.published_at ?? post.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline">Đang chờ đo</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Chưa có bài viết nào được xuất bản.
              </div>
            )}
          </div>
        </Panel>

        <Panel
          description="Tổng hợp các kênh dữ liệu đang chạy và các phần đang phát triển."
          title="Phạm vi theo dõi"
          action={<ActivityIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <CoverageRow
            description="Đơn hàng, doanh thu, trạng thái và quyền truy cập tải xuống đã hoạt động."
            label="Doanh số và dòng tiền"
            status="Hoạt động"
            tone="emerald"
          />
          <CoverageRow
            description="Thống kê sản phẩm bán chạy nhất được tính từ đơn hàng đã thanh toán."
            label="Hiệu suất sản phẩm"
            status="Hoạt động"
            tone="sky"
          />
          <CoverageRow
            description="Lượt xem bài viết đã hoạt động; bảng xếp hạng chi tiết sẽ có sau khi lưu lượng ổn định."
            label="Tương tác Blog"
            status="Một phần"
            tone="violet"
          />
          <CoverageRow
            description="Cần thêm bảng đánh giá phản hồi hoặc bình luận của người dùng."
            label="Hòm thư góp ý"
            status="Tiếp theo"
            tone="amber"
          />
          <CoverageRow
            description="Sự kiện ẩn danh theo dõi lượt xem trang, xem sản phẩm, thêm giỏ, checkout và tải file."
            label="Phân tích lưu lượng"
            status="Hoạt động"
            tone="emerald"
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          description="Luồng cập nhật nhanh từ các đơn hàng mới, thay đổi sản phẩm hoặc hoạt động đăng bài."
          title="Hoạt động gần đây"
          action={<Clock3Icon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          {data.activity.length > 0 ? (
            <div className="flex flex-col">
              {data.activity.map((item) => (
                <div
                  key={`${item.label}-${item.timestamp}-${item.meta}`}
                  className="flex items-start gap-3 border-b py-3 last:border-b-0"
                >
                  <span
                    className={cn("mt-1 size-2 rounded-full", dotClasses[item.tone])}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.meta}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(item.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Hoạt động sẽ xuất hiện sau khi sản phẩm, bài viết hoặc đơn hàng được tạo.
            </div>
          )}
        </Panel>

        <Panel
          description="Nơi quản lý và kiểm duyệt các bình luận và phản hồi từ khách hàng."
          title="Xem trước phản hồi"
          action={<MessageSquareIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-dashed p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Đánh giá sản phẩm</p>
                <Badge variant="outline">Chưa kết nối</Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Khi các đánh giá, nhận xét từ người mua được tích hợp, bảng điều khiển này sẽ hiển thị các phản hồi chờ duyệt, điểm đánh giá trung bình và hành động kiểm duyệt.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-lg font-semibold">--</p>
                <p className="text-xs text-muted-foreground">Chờ duyệt</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-lg font-semibold">--</p>
                <p className="text-xs text-muted-foreground">Điểm số</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-lg font-semibold">--</p>
                <p className="text-xs text-muted-foreground">Đề cập</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-sky-400 text-sky-950">
            <BarChart3Icon aria-hidden="true" className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold tracking-normal">
              Cột mốc phân tích Beta
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Hệ thống sự kiện Supabase hiện đã ghi nhận phễu ra mắt sản phẩm. Bước hữu ích tiếp theo là cảnh báo khi checkout, webhook, email hoặc tải tài nguyên bị lỗi.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          render={<Link href="/admin/products" />}
          nativeButton={false}
        >
          Quản lý sản phẩm
          <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
