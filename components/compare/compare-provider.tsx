"use client";

import {
  createContext,
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

export const MAX_COMPARE = 3;
const STORAGE_KEY = "dancrushop:compare";

export type CompareProduct = {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  productType: ProductType;
};

type CompareContextValue = {
  items: CompareProduct[];
  count: number;
  max: number;
  isLoaded: boolean;
  isComparing: (productId: string) => boolean;
  toggle: (product: CompareProduct) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function parseStored(value: string | null): CompareProduct[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is CompareProduct =>
          Boolean(item) &&
          typeof item.id === "string" &&
          typeof item.slug === "string" &&
          typeof item.title === "string"
      )
      .slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  // Latest items, read inside `toggle` so we can validate + toast OUTSIDE the
  // setState updater (updaters must stay pure — see [[no-side-effects-in-setstate-updater]]).
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Hydrate from localStorage once on mount. This must run in an effect (not a
  // lazy initializer) because the provider is server-rendered first, where
  // `window` is undefined; setting state here is the intended hydration step.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot localStorage hydration after SSR
    setItems(parseStored(window.localStorage.getItem(STORAGE_KEY)));
    setIsLoaded(true);
  }, []);

  // Persist + keep other tabs in sync.
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isLoaded]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        setItems(parseStored(event.newValue));
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const toggle = useCallback((product: CompareProduct) => {
    const current = itemsRef.current;

    if (current.some((item) => item.id === product.id)) {
      setItems(current.filter((item) => item.id !== product.id));
      return;
    }

    if (current.length >= MAX_COMPARE) {
      toast.error(`You can compare up to ${MAX_COMPARE} products.`, {
        description: "Remove one before adding another.",
      });
      return;
    }

    // Type-lock: a technical matrix only makes sense within one product type.
    if (current.length > 0 && current[0].productType !== product.productType) {
      toast.error("You can only compare products of the same type.", {
        description: "Clear the list to compare a different type.",
      });
      return;
    }

    trackAnalyticsEvent("compare_add", {
      metadata: { title: product.title },
      productId: product.id,
    });

    setItems([...current, product]);
  }, []);

  const isComparing = useCallback(
    (productId: string) => items.some((item) => item.id === productId),
    [items]
  );

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      count: items.length,
      max: MAX_COMPARE,
      isLoaded,
      isComparing,
      toggle,
      remove,
      clear,
    }),
    [items, isLoaded, isComparing, toggle, remove, clear]
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);

  if (!context) {
    throw new Error("useCompare must be used inside CompareProvider.");
  }

  return context;
}
