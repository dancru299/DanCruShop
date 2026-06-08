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
    canUseVietQr: paidCurrencies.length === 1 && paidCurrencies[0] === "VND",
    hasMixedCurrencies: paidCurrencies.length > 1,
    isFreeOnly: items.length > 0 && paidCurrencies.length === 0,
    paidCurrencies,
  };
}

export function getCartCheckoutWarning(items: CheckoutReadinessItem[]) {
  const readiness = getCartCheckoutReadiness(items);

  if (readiness.hasMixedCurrencies) {
    return "Giỏ hàng đang có nhiều loại tiền tệ. Hãy tách đơn trước khi checkout.";
  }

  if (readiness.isFreeOnly) {
    return "Giỏ hàng chỉ có tài nguyên miễn phí; bạn sẽ đăng nhập để mở trong dashboard.";
  }

  return null;
}
