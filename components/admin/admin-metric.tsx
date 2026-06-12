import type { ReactNode } from "react";

type AdminMetricProps = {
  label: string;
  value: ReactNode;
};

/** Metric card used in the stat row of admin list pages. */
export function AdminMetric({ label, value }: AdminMetricProps) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}
