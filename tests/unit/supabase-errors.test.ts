import { describe, expect, it } from "vitest";

import {
  getSupabaseErrorDetails,
  isMissingProductFavoritesTable,
} from "@/lib/supabase/errors";

describe("Supabase error helpers", () => {
  it("detects missing product favorites from PostgREST schema cache errors", () => {
    const error = {
      code: "PGRST205",
      details: null,
      hint: "Perhaps you meant the table 'public.product_categories'",
      message:
        "Could not find the table 'public.product_favorites' in the schema cache",
    };

    expect(isMissingProductFavoritesTable(error)).toBe(true);
    expect(getSupabaseErrorDetails(error)).toEqual({
      code: "PGRST205",
      details: null,
      hint: "Perhaps you meant the table 'public.product_categories'",
      message:
        "Could not find the table 'public.product_favorites' in the schema cache",
    });
  });

  it("does not treat unrelated Supabase errors as a missing favorites table", () => {
    expect(
      isMissingProductFavoritesTable({
        code: "42501",
        message: "permission denied for table profiles",
      })
    ).toBe(false);
  });
});
