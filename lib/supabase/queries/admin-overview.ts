import { requireAdmin } from "@/lib/auth/roles";
import { getSupabaseErrorDetails, isMissingSupabaseTable } from "@/lib/supabase/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import type {
  ActivityItem,
  AnalyticsEventRow,
  BlogPostRow,
  OrderItemRow,
  OrderRow,
  ProductRow,
  ProfileRow,
  PurchaseRow,
  TopBuyer,
  TopProduct,
} from "@/lib/admin/overview-types";
import {
  buildDailyTrend,
  formatMoney,
  getBetaFunnel,
  getLastDays,
  getPrimaryCurrency,
  isWithinDays,
  MS_PER_DAY,
  normalizeCurrency,
  sumOrdersInCurrency,
} from "@/lib/admin/overview-utils";

export async function getAdminOverviewData() {
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
