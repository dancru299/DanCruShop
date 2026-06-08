"use client";

import Link from "next/link";
import { HeartIcon } from "lucide-react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { Button } from "@/components/ui/button";

export function FavoritesHeaderButton() {
  const { favoriteCount } = useFavorites();

  return (
    <Button
      aria-label={`Yêu thích, ${favoriteCount} sản phẩm`}
      className="relative"
      render={<Link href="/favorites" />}
      nativeButton={false}
      size="icon"
      variant="outline"
    >
      <HeartIcon aria-hidden="true" />
      {favoriteCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-rose-400 px-1.5 text-[0.65rem] font-semibold leading-5 text-rose-950 shadow-sm">
          {favoriteCount}
        </span>
      ) : null}
    </Button>
  );
}
