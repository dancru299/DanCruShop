import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type DanCruShopMarkProps = HTMLAttributes<SVGSVGElement>;

export function DanCruShopMark({
  className,
  ...props
}: DanCruShopMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-6", className)}
      fill="none"
      viewBox="0 0 64 70"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* D-shaped cart body (counter cut out via even-odd) */}
      <path
        clipRule="evenodd"
        d="M12 13 20 8H34C48 8 56 18 56 30 56 42 48 52 34 52H12Z M22 18H33C43 18 47 24 47 30 47 36 43 42 33 42H22Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      {/* </> code glyph inside the counter */}
      <path
        d="M30 24 25.5 30 30 36"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path
        d="M37.5 23 31.5 37"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path
        d="M39 24 43.5 30 39 36"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      {/* cart wheels */}
      <circle cx="22" cy="64" r="4.6" fill="currentColor" />
      <circle cx="44" cy="64" r="4.6" fill="currentColor" />
    </svg>
  );
}

type DanCruShopLogoProps = HTMLAttributes<HTMLSpanElement> & {
  eyebrow?: string;
  eyebrowClassName?: string;
  markClassName?: string;
  markContainerClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

export function DanCruShopLogo({
  className,
  eyebrow,
  eyebrowClassName,
  markClassName,
  markContainerClassName,
  showWordmark = true,
  wordmarkClassName,
  ...props
}: DanCruShopLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)} {...props}>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-primary text-primary-foreground shadow-sm shadow-black/10",
          markContainerClassName
        )}
      >
        <DanCruShopMark className={cn("size-6", markClassName)} />
      </span>
      {showWordmark ? (
        <span className="grid min-w-0 gap-0.5">
          {eyebrow ? (
            <span
              className={cn(
                "text-xs font-medium leading-none text-muted-foreground",
                eyebrowClassName
              )}
            >
              {eyebrow}
            </span>
          ) : null}
          <span
            className={cn(
              "truncate text-base font-semibold leading-none tracking-normal text-foreground",
              wordmarkClassName
            )}
          >
            DanCruShop
          </span>
        </span>
      ) : null}
    </span>
  );
}
