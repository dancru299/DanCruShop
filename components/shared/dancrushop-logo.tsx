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
      <path
        clipRule="evenodd"
        d="M14 16h20.5C46.6 16 56 25 56 37c0 12.4-9.6 19-21.5 19H14V16Zm7.2 6.7v26.6h13.1c8.4 0 14.4-5 14.4-12.2 0-7.7-6.1-14.4-14.4-14.4H21.2Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <path
        d="M58 11v7.2H47.2c-2.5 0-3.5 1.1-4.1 3.3L34 56h-8l10.3-38.6C37.5 13 41 11 46.2 11H58Z"
        fill="currentColor"
      />
      <path
        d="M29.2 28L21.4 34.4L29.2 40.8"
        stroke="currentColor"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeWidth="4.5"
      />
      <path
        d="M42.2 28L50 34.4L42.2 40.8"
        stroke="currentColor"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeWidth="4.5"
      />
      <circle cx="22" cy="64" r="4.6" fill="currentColor" />
      <circle cx="40" cy="64" r="4.6" fill="currentColor" />
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
