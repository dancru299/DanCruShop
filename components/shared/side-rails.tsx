/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type RailConfig = { imageUrl: string | null; href: string | null };

// The rails are promo banners that belong to the hero region. They start at
// full opacity and fade linearly as the page scrolls down, so they are most
// prominent at the hero and fully gone by the time #product-showcase reaches
// the top of the viewport — reading as a top-of-page ad, not a permanent
// fixture. On pages without the showcase we fall back to scroll distance.
function useRailOpacity() {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const viewport = window.innerHeight;
      const scrolled = window.scrollY;
      const anchor = document.getElementById("product-showcase");
      let next: number;
      if (anchor) {
        // Absolute offset of the showcase from the top of the document; the
        // fade finishes a little before it so the rails clear the showcase.
        const anchorTop = anchor.getBoundingClientRect().top + scrolled;
        const fadeEnd = Math.max(1, anchorTop - viewport * 0.3);
        next = 1 - scrolled / fadeEnd;
      } else {
        next = 1 - scrolled / (viewport * 0.6);
      }
      setOpacity(Math.min(1, Math.max(0, next)));
    };
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(compute);
      }
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) {
        cancelAnimationFrame(raf);
      }
    };
  }, []);

  return opacity;
}

function RailBanner({
  rail,
  side,
  opacity,
}: {
  rail: RailConfig;
  side: "left" | "right";
  opacity: number;
}) {
  if (!rail.imageUrl) {
    return null;
  }

  const faded = opacity <= 0.02;

  return (
    <div
      style={{ opacity }}
      aria-hidden={faded}
      className={cn(
        // Rails sit in the gutter beside the max-w-6xl (72rem) content. Only show
        // them once the gutter is genuinely wide (>=1700px) — at narrower widths
        // they crowd the content and read as ad spam. The rail is a fixed 13rem
        // and centered in its gutter via calc, so it keeps an equal, breathing
        // margin from both the content and the viewport edge at any size. Pinned
        // near the top so they line up with the hero.
        "pointer-events-none fixed top-36 z-30 hidden w-52 min-[1700px]:block",
        side === "left"
          ? "left-[calc((100vw-72rem)/4-6.5rem)]"
          : "right-[calc((100vw-72rem)/4-6.5rem)]"
      )}
    >
      <Link
        href={rail.href || "#"}
        aria-label={`Promotion (${side})`}
        tabIndex={faded ? -1 : undefined}
        style={{ pointerEvents: faded ? "none" : "auto" }}
        className="block overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <img src={rail.imageUrl} alt="" className="block w-full" />
      </Link>
    </div>
  );
}

export function SideRails({
  promo,
}: {
  promo: { leftRail: RailConfig; rightRail: RailConfig };
}) {
  const opacity = useRailOpacity();

  if (!promo.leftRail.imageUrl && !promo.rightRail.imageUrl) {
    return null;
  }

  return (
    <>
      <RailBanner rail={promo.leftRail} side="left" opacity={opacity} />
      <RailBanner rail={promo.rightRail} side="right" opacity={opacity} />
    </>
  );
}
