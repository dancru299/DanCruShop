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
    "PayPal unlocks your products automatically after payment — they appear in your dashboard right away.",
  refund:
    "Refunds within 7 days if a product can't be accessed, has a serious defect, or doesn't match the description. Not available once the resource has been fully downloaded/used or if you change your mind after receiving the files.",
  support: "Email support replies within 24 hours during beta.",
};

// Shown in place of an empty "no reviews" state. New products have no buyer
// reviews yet, so we lead with an invitation plus what the team stands behind.
export const teamPledge = {
  heading: "Be the first to review!",
  intro:
    "No buyer reviews yet — this one is fresh. Until then, here's what the DanCruShop team stands behind:",
  promises: [
    "Hand-built and tested before it goes on sale.",
    "Email support replies within 24 hours.",
    "7-day refund if you can't access it or it doesn't match the description.",
  ],
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
