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
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const toneClasses: Record<Tone, string> = {
  amber: "bg-amber-400 text-amber-950",
  emerald: "bg-emerald-400 text-emerald-950",
  rose: "bg-rose-400 text-rose-950",
  sky: "bg-sky-400 text-sky-950",
  violet: "bg-violet-400 text-violet-950",
};

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
      label: order.status === "paid" ? "Paid order" : "Order activity",
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
        product.status === "published" ? "Product published" : "Product draft",
      meta: product.title,
      timestamp: product.created_at,
      tone: product.status === "published" ? ("sky" as const) : ("violet" as const),
    })),
    ...posts.slice(0, 4).map((post) => ({
      label: post.status === "published" ? "Post published" : "Post draft",
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

function MetricCard({
  description,
  Icon,
  label,
  tone,
  value,
}: {
  description: string;
  Icon: LucideIcon;
  label: string;
  tone: Tone;
  value: string;
}) {
  return (
    <div className="flex min-h-32 flex-col justify-between gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            toneClasses[tone]
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-semibold tracking-normal">{value}</p>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-sm text-muted-foreground">Admin command center</p>
          <h1 className="text-3xl font-semibold tracking-normal">
            DanCruShop Overview
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Track sales, cashflow, catalog health, buyer activity, content, and
            the analytics modules that still need instrumentation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            New Product
          </Button>
          <Button
            variant="outline"
            render={<Link href="/admin/orders" />}
            nativeButton={false}
          >
            <ReceiptTextIcon aria-hidden="true" data-icon="inline-start" />
            Orders
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description={`${getTrendLabel(currentRevenue, previousRevenue, (value) =>
            formatCompactMoney(value, data.primaryCurrency)
          )}`}
          Icon={CircleDollarSignIcon}
          label="Revenue"
          tone="emerald"
          value={formatCompactMoney(data.totalRevenueCents, data.primaryCurrency)}
        />
        <MetricCard
          description={`${formatNumber(data.pendingOrders)} pending, ${formatNumber(
            data.refundedOrders
          )} refunded`}
          Icon={ReceiptTextIcon}
          label="Orders"
          tone="sky"
          value={formatNumber(data.orders.length)}
        />
        <MetricCard
          description={`${formatNumber(data.publishedProducts)} published, ${formatNumber(
            data.draftProducts
          )} drafts`}
          Icon={PackageIcon}
          label="Products"
          tone="violet"
          value={formatNumber(data.totalProducts)}
        />
        <MetricCard
          description={`${formatNumber(data.newCustomers7d)} new profiles in 7d`}
          Icon={UsersIcon}
          label="Customers"
          tone="amber"
          value={formatNumber(data.customers)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel
          description="Primary currency only. Mixed-currency orders are kept out of this line until multi-currency reporting is added."
          title="Cashflow trend"
          action={<Badge variant="secondary">Last 14 days</Badge>}
        >
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Paid revenue</p>
              <p className="text-2xl font-semibold">
                {formatMoney(data.totalRevenueCents, data.primaryCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid orders</p>
              <p className="text-2xl font-semibold">
                {formatNumber(data.paidOrders.length)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active access</p>
              <p className="text-2xl font-semibold">
                {formatNumber(data.activePurchases)}
              </p>
            </div>
          </div>
          <LineChart
            emptyLabel="No paid orders in this period"
            formatter={(value) => formatCompactMoney(value, data.primaryCurrency)}
            gradientId="cashflowGradient"
            points={data.revenueTrend}
            tone="emerald"
          />
        </Panel>

        <Panel
          description="Anonymous Supabase events from the last 7 days."
          title="Interest signals"
          action={<GaugeIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Orders in 7d</p>
                <p className="text-2xl font-semibold">
                  {formatNumber(data.orders7d)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getTrendLabel(data.orders7d, data.previousOrders7d)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Visitors</p>
                <p className="text-2xl font-semibold">
                  {formatNumber(data.betaFunnel.uniqueVisitors)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(data.betaFunnel.pageViews)} page views
                </p>
              </div>
            </div>
            <MiniBars points={data.analyticsTrend} tone="sky" />
            <div className="rounded-lg border p-3">
              <FunnelRow label="Product views" value={data.betaFunnel.productViews} />
              <FunnelRow label="Add to cart" value={data.betaFunnel.addToCart} />
              <FunnelRow
                label="Checkout starts"
                value={data.betaFunnel.checkoutStarts}
              />
              <FunnelRow label="Paid orders" value={data.paidOrders.length} />
              <FunnelRow
                label="Download starts"
                value={data.betaFunnel.downloadStarts}
              />
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          description="Ranked by paid units sold from order items."
          title="Top 5 products"
          action={<ShoppingBagIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <RankedList
            currency={data.primaryCurrency}
            emptyLabel="No paid product sales yet."
            items={data.topProducts}
            maxValue={maxProductUnits}
            type="products"
          />
        </Panel>

        <Panel
          description="Best buyers by paid order revenue."
          title="Top buyers"
          action={<UserRoundIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <RankedList
            currency={data.primaryCurrency}
            emptyLabel="No paid buyers yet."
            items={data.topBuyers}
            maxValue={maxBuyerRevenue}
            type="buyers"
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel
          description="Content attention is ready for view tracking, but currently sorted by newest published posts."
          title="Content radar"
          action={<FileTextIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="text-xl font-semibold">{formatNumber(data.publishedPosts)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Drafts</p>
              <p className="text-xl font-semibold">{formatNumber(data.draftPosts)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Views</p>
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
                  <Badge variant="outline">Views pending</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No published posts yet.
              </div>
            )}
          </div>
        </Panel>

        <Panel
          description="A single place to see what is live and what still needs instrumentation."
          title="Tracking coverage"
          action={<ActivityIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <CoverageRow
            description="Orders, revenue, order status, and purchase access are available now."
            label="Sales and cashflow"
            status="Live"
            tone="emerald"
          />
          <CoverageRow
            description="Top products are calculated from paid order items."
            label="Product performance"
            status="Live"
            tone="sky"
          />
          <CoverageRow
            description="Page views are live; content-level ranking can come after beta traffic stabilizes."
            label="Blog attention"
            status="Partial"
            tone="violet"
          />
          <CoverageRow
            description="Needs product_feedback or comments table with moderation status."
            label="Feedback inbox"
            status="Next"
            tone="amber"
          />
          <CoverageRow
            description="Anonymous events now track page views, product views, cart adds, checkout starts, and downloads."
            label="Traffic analytics"
            status="Live"
            tone="emerald"
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          description="A quick feed from orders, catalog changes, and publishing activity."
          title="Recent activity"
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
              Activity will appear after products, posts, or orders are created.
            </div>
          )}
        </Panel>

        <Panel
          description="Future comments and ratings can land here as a moderation queue."
          title="Feedback preview"
          action={<MessageSquareIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-dashed p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Product feedback</p>
                <Badge variant="outline">Not connected</Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                When product comments, ratings, or testimonials are added, this
                panel can show pending reviews, sentiment, product mentions, and
                moderation actions.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-lg font-semibold">--</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-lg font-semibold">--</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-lg font-semibold">--</p>
                <p className="text-xs text-muted-foreground">Mentions</p>
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
              Beta analytics milestone
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Supabase events now capture the launch funnel. Next useful step is
              alerting on checkout, webhook, email, and download failures.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          render={<Link href="/admin/products" />}
          nativeButton={false}
        >
          Manage catalog
          <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
