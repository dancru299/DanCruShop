export const siteName = "DanCruShop";

export const defaultSupportEmail = "support@dancrushop.com";

/**
 * Absolute base URL of the storefront, used for canonical URLs, Open Graph,
 * sitemap, and structured data. Reads NEXT_PUBLIC_SITE_URL (client-safe) and
 * falls back to localhost for dev. No trailing slash.
 */
export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  return (url || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();

  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function getSupportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || defaultSupportEmail;
}

export function getSupportMailto(subject = "DanCruShop support") {
  return `mailto:${getSupportEmail()}?subject=${encodeURIComponent(subject)}`;
}

export const betaPolicies = {
  delivery:
    "Lemon Squeezy unlocks automatically after payment. VietQR is approved manually within 24 hours.",
  refund:
    "Refunds within 7 days if a product can't be accessed, has a serious defect, or doesn't match the description. Not available once the resource has been fully downloaded/used or if you change your mind after receiving the files.",
  support: "Email support replies within 24 hours during beta.",
};

export const policyLinks = [
  {
    href: "/delivery-policy",
    label: "Delivery",
  },
  {
    href: "/refund-policy",
    label: "Refunds",
  },
  {
    href: "/support",
    label: "Support",
  },
] as const;
