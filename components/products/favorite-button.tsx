"use client";

import { useState } from "react";
import { HeartIcon } from "lucide-react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  className?: string;
  productId: string;
  productTitle: string;
};

export function FavoriteButton({
  className,
  productId,
  productTitle,
}: FavoriteButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const { isFavorite, isLoaded, toggleFavorite } = useFavorites();
  const active = isFavorite(productId);
  const disabled = isPending || !isLoaded;

  async function handleToggle() {
    setIsPending(true);

    try {
      await toggleFavorite({ id: productId, title: productTitle });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void handleToggle();
      }}
      className={cn(
        "inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 text-white shadow-sm backdrop-blur-md transition hover:scale-105 hover:bg-black/60 active:scale-95 disabled:pointer-events-none disabled:opacity-60",
        className
      )}
    >
      <HeartIcon
        aria-hidden="true"
        className={cn(
          "size-[18px] transition-colors",
          active ? "fill-rose-500 text-rose-500" : "text-white/85"
        )}
      />
    </button>
  );
}
