"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchProductsForPalette,
  type PaletteProduct,
} from "@/actions/search.actions";

const DEBOUNCE_MS = 200;
const MIN_LENGTH = 2;

/**
 * Hook: debounced product search via Server Action.
 *
 * Usage:
 *   const { results, loading, query, setQuery } = usePaletteSearch();
 *   // Pass `results` and `loading` to the Command group.
 */
export function usePaletteSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaletteProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(0);

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();

    if (trimmed.length < MIN_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++abortRef.current;

    try {
      const data = await searchProductsForPalette(trimmed);

      // Discard stale responses
      if (id === abortRef.current) {
        setResults(data);
        setLoading(false);
      }
    } catch {
      if (id === abortRef.current) {
        setResults([]);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      doSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, doSearch]);

  return { results, loading, query, setQuery };
}