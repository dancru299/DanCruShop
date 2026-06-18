/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, DownloadIcon, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import {
  heroSpotlightCards,
  type HeroSpotlightCard,
} from "@/lib/store/hero-spotlight";

// Auto-advance interval and rotation duration (ms). The interval restarts after
// every turn, so each card is shown for ~AUTOPLAY_MS.
const AUTOPLAY_MS = 5000;
const ROTATE_MS = 800;
// Symmetric ease so the carousel sweep accelerates and settles smoothly.
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
// Cylinder radius as a fraction of the card width — larger = cards swing wider
// to the sides so only the front card stays visible head-on.
const RADIUS_RATIO = 0.72;

function formatDownloads(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(value)
    .toLowerCase();
}

export function HeroProductSlider({
  cards = heroSpotlightCards,
}: {
  // Auto-ranked published products; falls back to the prototype cards when the
  // catalog has none to show yet.
  cards?: HeroSpotlightCard[];
}) {
  const visibleCards = cards.slice(0, 5);
  const count = visibleCards.length;

  // `front` faces the viewer. During a turn, `pending` holds the card rotating
  // in and the direction the whole ring spins (-90 = next from the right,
  // +90 = previous from the left). `turning` drives the CSS transition.
  const [front, setFront] = useState(0);
  const [pending, setPending] = useState<{ target: number; rotation: number } | null>(
    null
  );
  const [turning, setTurning] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [radius, setRadius] = useState(220);

  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);

  // Keep the ring radius proportional to the rendered card width.
  useEffect(() => {
    const node = stageRef.current;
    if (!node) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setRadius(Math.round(entry.contentRect.width * RADIUS_RATIO));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback(
    (target: number, direction?: 1 | -1) => {
      if (lockRef.current || target === front || count <= 1) {
        return;
      }
      lockRef.current = true;

      if (reducedMotion) {
        setFront(target);
        lockRef.current = false;
        return;
      }

      // Default to the shorter way around the ring.
      const forwardSteps = (target - front + count) % count;
      const dir = direction ?? (forwardSteps <= count / 2 ? 1 : -1);
      const rotation = dir === 1 ? -90 : 90;

      setPending({ target, rotation });
      // Two RAFs guarantee the incoming card paints at its side position before
      // the ring starts spinning — otherwise the browser skips the transition.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setTurning(true))
      );
      window.setTimeout(() => {
        // Commit: the incoming card becomes the front. Resetting the ring to 0
        // with no transition is invisible because that card is already centered.
        setFront(target);
        setPending(null);
        setTurning(false);
        lockRef.current = false;
      }, ROTATE_MS + 20);
    },
    [count, front, reducedMotion]
  );

  const next = useCallback(() => goTo((front + 1) % count, 1), [count, front, goTo]);

  // Autoplay — paused on hover or when the tab is hidden.
  useEffect(() => {
    if (hovered || hidden || count <= 1) {
      return;
    }
    const id = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, hidden, hovered, next]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const activeDot = pending?.target ?? front;
  const stageRotation = turning && pending ? pending.rotation : 0;
  // The incoming card sits 90° to the side it will sweep in from.
  const incomingAngle = pending ? -pending.rotation : 0;

  return (
    <div
      className="relative flex w-full max-w-108 flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="group"
      aria-roledescription="Featured product carousel"
    >
      <div className="pointer-events-none absolute inset-x-6 bottom-2 top-8 rounded-full bg-primary/10 blur-3xl" />

      {/* 3D ring: cards live on a cylinder; spinning the ring sweeps them past. */}
      <div className="relative perspective-[1200px]">
        <div
          ref={stageRef}
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            transform: `translateZ(-${radius}px) rotateY(${stageRotation}deg)`,
            transition: turning ? `transform ${ROTATE_MS}ms ${EASE}` : undefined,
          }}
        >
          {/* Front-facing card — stays in flow so it defines the ring height. */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: `rotateY(0deg) translateZ(${radius}px)`,
            }}
            aria-hidden={turning}
          >
            <SpotlightCard card={visibleCards[front]} />
          </div>

          {/* Incoming card, parked on the ring 90° away until it sweeps in. */}
          {pending ? (
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                transform: `rotateY(${incomingAngle}deg) translateZ(${radius}px)`,
              }}
            >
              <SpotlightCard card={visibleCards[pending.target]} />
            </div>
          ) : null}
        </div>
      </div>

      {count > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {visibleCards.map((card, dotIndex) => {
            const active = dotIndex === activeDot;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => goTo(dotIndex)}
                aria-label={`Xem ${card.title}`}
                aria-current={active}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  active
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-border hover:bg-muted-foreground/60"
                )}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SpotlightCard({ card }: { card: HeroSpotlightCard }) {
  const detailRows = [
    // { label: "Type", value: card.typeLabel },
    // { label: "Delivery", value: card.deliveryLabel },
    { label: "Price", value: card.priceLabel },
  ];

  return (
    <article className="flex h-120 w-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/70 p-3 shadow-2xl shadow-black/25 backdrop-blur-xl">
      {/* Image on top — rounded, inset, with status/type overlays */}
      <div className="relative h-56 w-full shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted">
        {card.thumbnailUrl ? (
          <img
            src={card.thumbnailUrl}
            alt={card.title}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0,transparent_45%),linear-gradient(180deg,var(--muted),var(--background))] opacity-70" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground shadow-sm backdrop-blur">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            On sale
          </span>
          <span className="rounded-full bg-background/85 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground shadow-sm backdrop-blur">
            {card.typeLabel}
          </span>
        </div>
      </div>

      {/* Info below */}
      <div className="flex flex-1 flex-col gap-2 px-1 pb-0.5 pt-3">
        <div className="grid gap-1">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {card.eyebrow}
          </p>
          <h2 className="line-clamp-2 text-base font-semibold leading-snug tracking-[-0.01em]">
            {card.title}
          </h2>
        </div>

        {/* Rating + downloads. With no reviews yet we show a neutral "New"
            badge instead of "0.0 ★", which reads as a poorly-rated product. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {card.ratingCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-medium">
              <StarIcon
                aria-hidden="true"
                className="size-3.5 fill-amber-400 text-amber-400"
              />
              {card.rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">
                ({card.ratingCount})
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.7rem] font-semibold text-emerald-600 dark:text-emerald-400">
              New
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-medium">
            <DownloadIcon
              aria-hidden="true"
              className="size-3.5 text-muted-foreground"
            />
            {formatDownloads(card.downloads)}
            <span className="font-normal text-muted-foreground">downloads</span>
          </span>
        </div>

        {/* Tech-stack icons — placeholder initials until real assets are uploaded */}
        {card.icons.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {card.icons.map((icon) => (
              <span
                key={icon.label}
                title={icon.label}
                className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-background/80 text-[0.6rem] font-semibold text-muted-foreground shadow-sm"
              >
                {icon.src ? (
                  <img
                    src={icon.src}
                    alt={icon.label}
                    className="size-4 object-contain"
                  />
                ) : (
                  icon.label.slice(0, 2)
                )}
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid gap-1.5 rounded-xl border border-border/80 bg-background/70 p-2.5">
          {detailRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span className="text-right font-medium">{row.value}</span>
            </div>
          ))}
        </div>

        <Button
          size="sm"
          className="mt-auto w-full"
          render={<Link href={card.href} />}
          nativeButton={false}
          variant="secondary"
        >
          View details
          <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      </div>
    </article>
  );
}
