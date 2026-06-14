import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type SectionHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function SectionHeader({
  title,
  description,
  actionLabel,
  actionHref,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actionLabel && actionHref ? (
        <Button
          className="w-fit"
          variant="outline"
          render={<Link href={actionHref} />}
          nativeButton={false}
        >
          {actionLabel}
          <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      ) : null}
    </div>
  );
}
