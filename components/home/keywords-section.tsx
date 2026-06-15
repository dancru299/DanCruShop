import Link from "next/link";
import { SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { KeywordsSection as KeywordsConfig } from "@/lib/store/home-layout";

// Rotating accent gradients so each pill stands out, like the reference design.
const PILL_GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-slate-600 to-slate-800",
];

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

        <div className="flex flex-wrap gap-3">
          {items.map((item, index) => (
            <Link
              key={`${item.label}-${index}`}
              href={item.href || "/products"}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                PILL_GRADIENTS[index % PILL_GRADIENTS.length]
              )}
            >
              <SparklesIcon aria-hidden="true" className="size-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
