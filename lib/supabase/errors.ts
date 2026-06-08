export type SupabaseErrorDetails = {
  code: string | null;
  details: string | null;
  hint: string | null;
  message: string;
};

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

export function getSupabaseErrorDetails(
  error: unknown
): SupabaseErrorDetails {
  if (!error || typeof error !== "object") {
    return {
      code: null,
      details: null,
      hint: null,
      message: error instanceof Error ? error.message : "Unknown Supabase error",
    };
  }

  const record = error as Record<string, unknown>;

  return {
    code: getStringValue(record.code),
    details: getStringValue(record.details),
    hint: getStringValue(record.hint),
    message:
      getStringValue(record.message) ??
      (error instanceof Error ? error.message : "Unknown Supabase error"),
  };
}

export function isMissingProductFavoritesTable(error: unknown) {
  const details = getSupabaseErrorDetails(error);
  const message = details.message.toLowerCase();

  return (
    details.code === "PGRST205" ||
    details.code === "42P01" ||
    (message.includes("product_favorites") &&
      (message.includes("schema cache") ||
        message.includes("does not exist") ||
        message.includes("could not find")))
  );
}
