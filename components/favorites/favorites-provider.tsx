"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  getSupabaseErrorDetails,
  isMissingProductFavoritesTable,
} from "@/lib/supabase/errors";

type FavoriteProductInput = {
  id: string;
  title?: string;
};

type FavoriteRow = {
  product_id: string;
};

type FavoritesContextValue = {
  favoriteCount: number;
  isFavorite: (productId: string) => boolean;
  isLoaded: boolean;
  toggleFavorite: (product: FavoriteProductInput) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function warnFavoriteStorage(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(context, getSupabaseErrorDetails(error));
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [isSchemaReady, setIsSchemaReady] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadFavorites() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      setUserId(user?.id ?? null);

      if (!user) {
        setFavoriteIds(new Set());
        setIsLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from("product_favorites")
        .select("product_id")
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        if (isMissingProductFavoritesTable(error)) {
          setIsSchemaReady(false);
          warnFavoriteStorage(
            "Favorites are unavailable because product_favorites is not deployed.",
            error
          );
        } else {
          warnFavoriteStorage("Failed to load favorites.", error);
          toast.error("Không thể tải danh sách yêu thích.");
        }

        setFavoriteIds(new Set());
      } else {
        setIsSchemaReady(true);
        setFavoriteIds(
          new Set(((data ?? []) as FavoriteRow[]).map((row) => row.product_id))
        );
      }

      setIsLoaded(true);
    }

    loadFavorites();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (!isMounted) {
        return;
      }

      setFavoriteIds(new Set());
      setUserId(null);
      setIsLoaded(false);
      loadFavorites();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (product: FavoriteProductInput) => {
      if (!isSchemaReady) {
        toast.error("Tính năng yêu thích chưa được bật.", {
          description: "Chạy supabase/product-favorites.sql trên Supabase.",
        });
        return;
      }

      if (!userId) {
        toast.message("Đăng nhập để lưu sản phẩm yêu thích.", {
          description: product.title,
        });
        return;
      }

      const supabase = createClient();
      const wasFavorite = favoriteIds.has(product.id);

      setFavoriteIds((current) => {
        const next = new Set(current);

        if (wasFavorite) {
          next.delete(product.id);
        } else {
          next.add(product.id);
        }

        return next;
      });

      const { error } = wasFavorite
        ? await supabase
            .from("product_favorites")
            .delete()
            .eq("user_id", userId)
            .eq("product_id", product.id)
        : await supabase.from("product_favorites").insert({
            product_id: product.id,
            user_id: userId,
          });

      if (error) {
        setFavoriteIds((current) => {
          const next = new Set(current);

          if (wasFavorite) {
            next.add(product.id);
          } else {
            next.delete(product.id);
          }

          return next;
        });

        if (isMissingProductFavoritesTable(error)) {
          setIsSchemaReady(false);
          warnFavoriteStorage(
            "Favorites are unavailable because product_favorites is not deployed.",
            error
          );
          toast.error("Tính năng yêu thích chưa được bật.", {
            description: "Chạy supabase/product-favorites.sql trên Supabase.",
          });
        } else {
          warnFavoriteStorage("Failed to toggle favorite.", error);
          toast.error("Không thể cập nhật yêu thích.", {
            description: product.title,
          });
        }

        return;
      }

      toast.success(
        wasFavorite ? "Đã bỏ khỏi yêu thích." : "Đã lưu vào yêu thích.",
        {
          description: product.title,
        }
      );
    },
    [favoriteIds, isSchemaReady, userId]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteCount: favoriteIds.size,
      isFavorite,
      isLoaded,
      toggleFavorite,
    }),
    [favoriteIds.size, isFavorite, isLoaded, toggleFavorite]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider.");
  }

  return context;
}
