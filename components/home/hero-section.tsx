import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { HeroProductSlider } from "@/components/home/hero-product-slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildHeroSpotlightCards } from "@/lib/store/hero-spotlight";
import { getHeroSpotlightProducts } from "@/lib/supabase/queries/spotlight";
import type { HeroSection as HeroSectionConfig } from "@/lib/store/home-layout";

function HeroCtas({ section }: { section: HeroSectionConfig }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {section.primaryCta.label ? (
        <Button size="lg" render={<Link href={section.primaryCta.href || "#"} />} nativeButton={false}>
          {section.primaryCta.label}
          <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      ) : null}
      {section.secondaryCta.label ? (
        <Button
          size="lg"
          variant="outline"
          render={<Link href={section.secondaryCta.href || "#"} />}
          nativeButton={false}
        >
          {section.secondaryCta.label}
        </Button>
      ) : null}
    </div>
  );
}

function HeroSignals({
  section,
  className,
}: {
  section: HeroSectionConfig;
  className?: string;
}) {
  if (section.signals.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid gap-3 md:grid-cols-3", className)}>
      {section.signals.map((item, index) => (
        <div
          key={`${item.title}-${index}`}
          className="rounded-xl border border-border/80 bg-card/55 p-3.5 shadow-sm backdrop-blur-xl"
        >
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}

export async function HeroSection({ section }: { section: HeroSectionConfig }) {
  if (section.variant !== "split") {
    const centered = section.variant === "centered";

    return (
      <section className="relative overflow-hidden border-b border-border/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--primary)_0,transparent_40%)] opacity-25" />
        <div
          className={cn(
            "relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-12 md:py-16",
            centered && "items-center text-center"
          )}
        >
          {section.eyebrow ? (
            <div className="inline-flex w-fit items-center rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              {section.eyebrow}
            </div>
          ) : null}
          <h1 className="max-w-4xl text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-balance sm:text-4xl md:text-5xl">
            {section.title}
          </h1>
          {section.subtitle ? (
            <p
              className={cn(
                "max-w-2xl text-base leading-7 text-muted-foreground md:text-lg",
                centered && "mx-auto"
              )}
            >
              {section.subtitle}
            </p>
          ) : null}
          <HeroCtas section={section} />
          {centered ? <HeroSignals section={section} className="mt-4 w-full" /> : null}
        </div>
      </section>
    );
  }

  // Auto-ranked spotlight cards for the split hero. `undefined` lets the slider
  // fall back to its prototype cards when the catalog has nothing published.
  const built = section.showSpotlight
    ? buildHeroSpotlightCards(await getHeroSpotlightProducts())
    : [];
  const spotlightCards = built.length > 0 ? built : undefined;

  return (
    <section className="relative overflow-hidden border-b border-border/80">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0,transparent_32%),radial-gradient(circle_at_top_right,var(--muted)_0,transparent_38%)] opacity-35" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.06]" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:py-10 lg:grid-cols-[1fr_27rem] lg:items-start lg:gap-10">
        <div className="flex max-w-xl flex-col gap-4">
          {section.eyebrow ? (
            <div className="inline-flex w-fit items-center rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              {section.eyebrow}
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <h1 className="max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-balance sm:text-4xl md:text-5xl">
              {section.title}
            </h1>
            {section.subtitle ? (
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                {section.subtitle}
              </p>
            ) : null}
          </div>

          <HeroCtas section={section} />
          <HeroSignals section={section} className="hidden md:grid" />
        </div>

        {section.showSpotlight ? (
          <div className="hidden lg:flex lg:items-start lg:justify-end">
            <HeroProductSlider cards={spotlightCards} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
