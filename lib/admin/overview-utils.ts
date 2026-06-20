import type {
  AnalyticsEventRow,
  BetaFunnel,
  OrderRow,
  Tone,
  TrendPoint,
} from "@/lib/admin/overview-types";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const toneClasses: Record<Tone, string> = {
  amber: "bg-amber-400 text-amber-950",
  emerald: "bg-emerald-400 text-emerald-950",
  rose: "bg-rose-400 text-rose-950",
  sky: "bg-sky-400 text-sky-950",
  violet: "bg-violet-400 text-violet-950",
};

export const dotClasses: Record<Tone, string> = {
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  rose: "bg-rose-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
};

export const toneHex: Record<Tone, string> = {
  amber: "#fbbf24",
  emerald: "#34d399",
  rose: "#fb7185",
  sky: "#38bdf8",
  violet: "#a78bfa",
};

export function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getLastDays(days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    return new Date(today.getTime() - (days - 1 - index) * MS_PER_DAY);
  });
}

export function isWithinDays(value: string, days: number) {
  return new Date(value).getTime() >= Date.now() - days * MS_PER_DAY;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function normalizeCurrency(currency: string | null | undefined) {
  return currency?.trim().toUpperCase() || "USD";
}

export function getCurrencyAmount(cents: number, currency: string) {
  return currency === "VND" ? cents : cents / 100;
}

export function formatMoney(cents: number, currency: string) {
  const normalizedCurrency = normalizeCurrency(currency);

  return new Intl.NumberFormat(normalizedCurrency === "VND" ? "vi-VN" : "en-US", {
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "VND" ? 0 : 2,
    style: "currency",
  }).format(getCurrencyAmount(cents, normalizedCurrency));
}

export function formatCompactMoney(cents: number, currency: string) {
  const normalizedCurrency = normalizeCurrency(currency);

  return new Intl.NumberFormat(normalizedCurrency === "VND" ? "vi-VN" : "en-US", {
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === "VND" ? 0 : 1,
    notation: "compact",
    style: "currency",
  }).format(getCurrencyAmount(cents, normalizedCurrency));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function getTrendLabel(current: number, previous: number, formatter = formatNumber) {
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

export function getPrimaryCurrency(orders: OrderRow[]) {
  const totals = new Map<string, number>();

  orders.forEach((order) => {
    const currency = normalizeCurrency(order.currency);
    totals.set(currency, (totals.get(currency) ?? 0) + order.total_cents);
  });

  return (
    [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD"
  );
}

export function sumOrdersInCurrency(orders: OrderRow[], currency: string) {
  return orders.reduce((total, order) => {
    return normalizeCurrency(order.currency) === currency
      ? total + order.total_cents
      : total;
  }, 0);
}

export function buildDailyTrend(
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

export function countEvents(events: AnalyticsEventRow[], eventName: string) {
  return events.filter((event) => event.event_name === eventName).length;
}

export function getUniqueVisitorCount(events: AnalyticsEventRow[]) {
  const visitors = new Set<string>();

  events.forEach((event) => {
    const visitorId = event.user_id ?? event.anonymous_id;

    if (visitorId) {
      visitors.add(visitorId);
    }
  });

  return visitors.size;
}

export function getBetaFunnel(events: AnalyticsEventRow[]): BetaFunnel {
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
