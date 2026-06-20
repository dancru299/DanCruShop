import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tone, TopBuyer, TopProduct } from "@/lib/admin/overview-types";
import {
  dotClasses,
  formatCompactMoney,
  formatNumber,
} from "@/lib/admin/overview-utils";

export function RankedList({
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

export function Panel({
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

export function CoverageRow({
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

export function FunnelRow({
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
