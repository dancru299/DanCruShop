/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { cn } from "@/lib/utils";

type RailConfig = { imageUrl: string | null; href: string | null };

function RailBanner({
  rail,
  side,
}: {
  rail: RailConfig;
  side: "left" | "right";
}) {
  if (!rail.imageUrl) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed top-1/2 z-30 hidden w-40 -translate-y-1/2 2xl:block",
        side === "left" ? "left-4" : "right-4"
      )}
    >
      <Link
        href={rail.href || "#"}
        aria-label={`Khuyến mãi ${side === "left" ? "bên trái" : "bên phải"}`}
        className="pointer-events-auto block overflow-hidden rounded-xl border border-border/80 bg-card shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
  if (!promo.leftRail.imageUrl && !promo.rightRail.imageUrl) {
    return null;
  }

  return (
    <>
      <RailBanner rail={promo.leftRail} side="left" />
      <RailBanner rail={promo.rightRail} side="right" />
    </>
  );
}
