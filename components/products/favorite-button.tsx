"use client";

import { useState } from "react";
import { HeartIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Wishlist toggle for product cards. Visual/local state only — wiring it to a
 * persisted wishlist would need a backend table + action.
 */
export function FavoriteButton({ className }: { className?: string }) {
  const [active, setActive] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setActive((value) => !value);
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white shadow-sm backdrop-blur-md transition hover:scale-105 hover:bg-black/60 active:scale-95",
        className,
      )}
    >
      <HeartIcon
        className={cn(
          "size-[18px] transition-colors",
          active ? "fill-rose-500 text-rose-500" : "text-white/85",
        )}
      />
    </button>
  );
}
