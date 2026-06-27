export type CheckoutReadinessItem = {
  currency: string;
  isFree: boolean;
};

export function getPaidCurrencies(items: CheckoutReadinessItem[]) {
  return Array.from(
    new Set(
      items
        .filter((item) => !item.isFree)
        .map((item) => item.currency.trim().toUpperCase() || "USD")
    )
  );
}

export function getCartCheckoutReadiness(items: CheckoutReadinessItem[]) {
  const paidCurrencies = getPaidCurrencies(items);

  return {
    hasMixedCurrencies: paidCurrencies.length > 1,
    isFreeOnly: items.length > 0 && paidCurrencies.length === 0,
    paidCurrencies,
  };
}

export function getCartCheckoutWarning(items: CheckoutReadinessItem[]) {
  const readiness = getCartCheckoutReadiness(items);

  if (readiness.hasMixedCurrencies) {
    return "Your cart has multiple currencies. Split the order before checking out.";
  }

  if (readiness.isFreeOnly) {
    return "Your cart only has free resources; log in to open them in your dashboard.";
  }

  return null;
}
