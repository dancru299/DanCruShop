import { CheckCircle2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

type StackBadgeProps = {
  matchPercent: number;
  className?: string;
};

const badgeStyles = (percent: number) => {
  if (percent === 100) {
    return {
      label: "100% Match",
      className:
        "border-emerald-500/35 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      showIcon: true,
    };
  }

  if (percent >= 67) {
    return {
      label: `${percent}% Match`,
      className:
        "border-amber-500/35 bg-amber-500/15 text-amber-600 dark:text-amber-400",
      showIcon: false,
    };
  }

  if (percent >= 34) {
    return {
      label: `${percent}% Match`,
      className:
        "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      showIcon: false,
    };
  }

  return {
    label: "Near match",
    className:
      "border-border bg-muted/40 text-foreground/70 dark:text-foreground/50",
    showIcon: false,
  };
};

export function StackBadge({ matchPercent, className }: StackBadgeProps) {
  const { label, className: styleClass, showIcon } = badgeStyles(matchPercent);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold",
        styleClass,
        className
      )}
    >
      {showIcon ? (
        <CheckCircle2Icon aria-hidden="true" className="size-3" />
      ) : null}
      {label}
    </span>
  );
}