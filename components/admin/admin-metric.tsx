import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "amber" | "emerald" | "rose" | "sky" | "violet" | "neutral";

type AdminMetricProps = {
  label: string;
  value: ReactNode;
  description?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
};

const toneClasses: Record<Tone, string> = {
  amber: "bg-amber-400/20 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20",
  emerald: "bg-emerald-400/20 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20",
  rose: "bg-rose-400/20 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-500/20",
  sky: "bg-sky-400/20 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-500/20",
  violet: "bg-violet-400/20 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-500/20",
  neutral: "bg-muted text-muted-foreground border",
};

/** Metric card used in the stat row of admin list pages and dashboards. */
export function AdminMetric({
  label,
  value,
  description,
  Icon,
  tone = "neutral",
}: AdminMetricProps) {
  if (Icon || description) {
    return (
      <div className="flex min-h-32 flex-col justify-between gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                toneClasses[tone]
              )}
            >
              <Icon className="size-4" />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-semibold tracking-normal">{value}</p>
          {description && (
            <p className="text-xs leading-5 text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}
