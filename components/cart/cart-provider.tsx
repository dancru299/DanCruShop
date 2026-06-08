"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { ProductType } from "@/lib/supabase/queries/products";

const CART_STORAGE_KEY = "dancrushop-cart-v1";
const CART_ANIMATION_MS = 760;

export type CartProduct = {
  currency: string;
  id: string;
  isFree: boolean;
  priceCents: number;
  productType: ProductType;
  slug: string;
  thumbnailUrl: string | null;
  title: string;
};

export type CartItem = CartProduct & {
  quantity: 1;
};

type FlyItem = {
  id: string;
  imageUrl: string | null;
  title: string;
  transform: string;
  x: number;
  y: number;
};

type AddToCartOptions = {
  sourceElement?: HTMLElement | null;
};

type CartContextValue = {
  addItem: (product: CartProduct, options?: AddToCartOptions) => void;
  clearCart: () => void;
  itemCount: number;
  items: CartItem[];
  removeItem: (productId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<CartItem>;

  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.slug === "string" &&
    typeof item.currency === "string" &&
    typeof item.priceCents === "number" &&
    typeof item.isFree === "boolean" &&
    typeof item.productType === "string" &&
    item.quantity === 1
  );
}

function readStoredCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as unknown;

    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

function writeStoredCart(items: CartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("dancrushop-cart-change"));
}

function getAnimationStart(sourceElement?: HTMLElement | null) {
  const sourceRect = sourceElement?.getBoundingClientRect();

  if (sourceRect) {
    return {
      x: sourceRect.left + sourceRect.width / 2 - 24,
      y: sourceRect.top + sourceRect.height / 2 - 24,
    };
  }

  return {
    x: window.innerWidth / 2 - 24,
    y: window.innerHeight / 2 - 24,
  };
}

function getAnimationTransform(start: { x: number; y: number }) {
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  const targetRect = target?.getBoundingClientRect();

  if (!targetRect) {
    return "translate3d(0, -80px, 0) scale(0.35)";
  }

  const targetX = targetRect.left + targetRect.width / 2 - 24;
  const targetY = targetRect.top + targetRect.height / 2 - 24;

  return `translate3d(${targetX - start.x}px, ${targetY - start.y}px, 0) scale(0.28)`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [flyItems, setFlyItems] = useState<FlyItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);

  const syncItems = useCallback((nextItems: CartItem[]) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }, []);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      syncItems(readStoredCart());
    }, 0);

    function handleExternalCartChange() {
      syncItems(readStoredCart());
    }

    window.addEventListener("storage", handleExternalCartChange);
    window.addEventListener("dancrushop-cart-change", handleExternalCartChange);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("storage", handleExternalCartChange);
      window.removeEventListener(
        "dancrushop-cart-change",
        handleExternalCartChange
      );
    };
  }, [syncItems]);

  const addFlyItem = useCallback(
    (product: CartProduct, options?: AddToCartOptions) => {
      if (typeof window === "undefined") {
        return;
      }

      const start = getAnimationStart(options?.sourceElement);
      const id = `${product.id}-${Date.now()}`;

      setFlyItems((current) => [
        ...current,
        {
          id,
          imageUrl: product.thumbnailUrl,
          title: product.title,
          transform: getAnimationTransform(start),
          x: start.x,
          y: start.y,
        },
      ]);

      window.setTimeout(() => {
        setFlyItems((current) => current.filter((item) => item.id !== id));
      }, CART_ANIMATION_MS);
    },
    []
  );

  const addItem = useCallback(
    (product: CartProduct, options?: AddToCartOptions) => {
      const currentItems = itemsRef.current;
      const toastId = `cart-product-${product.id}`;

      if (currentItems.some((item) => item.id === product.id)) {
        toast.message("Đã có trong giỏ", {
          description: product.title,
          id: toastId,
        });
        return;
      }

      addFlyItem(product, options);

      const nextItems = [
        ...currentItems,
        {
          ...product,
          quantity: 1 as const,
        },
      ];

      syncItems(nextItems);
      writeStoredCart(nextItems);
      trackAnalyticsEvent("add_to_cart", {
        metadata: {
          currency: product.currency,
          is_free: product.isFree,
          price_cents: product.priceCents,
          product_type: product.productType,
          slug: product.slug,
        },
        productId: product.id,
      });
      toast.success("Đã thêm vào giỏ", {
        description: product.title,
        id: toastId,
      });
    },
    [addFlyItem, syncItems]
  );

  const removeItem = useCallback((productId: string) => {
    const nextItems = itemsRef.current.filter((item) => item.id !== productId);

    syncItems(nextItems);
    writeStoredCart(nextItems);
  }, [syncItems]);

  const clearCart = useCallback(() => {
    syncItems([]);
    writeStoredCart([]);
  }, [syncItems]);

  const value = useMemo<CartContextValue>(
    () => ({
      addItem,
      clearCart,
      itemCount: items.length,
      items,
      removeItem,
    }),
    [addItem, clearCart, items, removeItem]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]">
        {flyItems.map((item) => (
          <div
            key={item.id}
            className="motion-cart-fly fixed flex size-12 items-center justify-center overflow-hidden rounded-lg border bg-card text-card-foreground shadow-2xl"
            style={
              {
                "--cart-fly-transform": item.transform,
                left: item.x,
                top: item.y,
              } as CSSProperties
            }
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="size-full object-cover"
                src={item.imageUrl}
              />
            ) : (
              <span className="text-sm font-semibold">
                {item.title.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
