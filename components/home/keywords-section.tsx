import Link from "next/link";
import { SparklesIcon } from "lucide-react";

import type { KeywordsSection as KeywordsConfig } from "@/lib/store/home-layout";

export function KeywordsSection({ section }: { section: KeywordsConfig }) {
  const items = section.items.filter((item) => item.label.trim().length > 0);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="scroll-mt-24 border-b border-border/80 py-10 md:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-normal md:text-2xl">
            {section.title}
          </h2>
          {section.description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {section.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {items.map((item, index) => (
            <Link
              key={`${item.label}-${index}`}
              href={item.href || "/products"}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-foreground/20 hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <SparklesIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
