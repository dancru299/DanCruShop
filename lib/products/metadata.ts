import { productTypeDescriptions } from "@/lib/products/display";
import type { ProductType } from "@/lib/supabase/queries/products";

export type ProductMetadata = Record<string, unknown>;

type ProductMetadataSource = {
  description: string | null;
  metadata: ProductMetadata;
  product_type: ProductType;
  short_description: string | null;
};

export function getStringArrayFromProductMetadata(
  metadata: ProductMetadata,
  key: string
) {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );

  return items.length > 0 ? items : null;
}

export function getStringFromProductMetadata(
  metadata: ProductMetadata,
  key: string
) {
  const value = metadata[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function getProductIncludedItems(product: ProductMetadataSource) {
  const metadataItems =
    getStringArrayFromProductMetadata(product.metadata, "includes") ??
    getStringArrayFromProductMetadata(product.metadata, "features") ??
    getStringArrayFromProductMetadata(product.metadata, "highlights");

  if (metadataItems) {
    return metadataItems;
  }

  const descriptionLines = product.description
    ?.split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 0);

  if (descriptionLines && descriptionLines.length >= 3) {
    return descriptionLines.slice(0, 6);
  }

  return [
    "Instant access right after a successful payment",
    "A tidy resource package, ready for real projects",
    "Context, setup notes, and practical usage guidance",
    "Future updates delivered through your purchased dashboard",
  ];
}

export function getProductRequirements(product: ProductMetadataSource) {
  return (
    getStringArrayFromProductMetadata(product.metadata, "requirements") ?? [
      "A DanCruShop account to open the dashboard after checkout.",
      "Read the description, tech stack, and license before using it in real projects.",
    ]
  );
}

export function getProductCompatibility(product: ProductMetadataSource) {
  return (
    getStringFromProductMetadata(product.metadata, "compatibility") ??
    product.short_description ??
    productTypeDescriptions[product.product_type]
  );
}

export function getProductUpdatePolicy(product: ProductMetadataSource) {
  return (
    getStringFromProductMetadata(product.metadata, "update_policy") ??
    "Buyers can re-download updates through the dashboard when the shop publishes a new version."
  );
}

export function getProductSupportNote(product: ProductMetadataSource) {
  return (
    getStringFromProductMetadata(product.metadata, "support_note") ??
    "If a resource can't be accessed or doesn't match the description, contact support within 7 days."
  );
}

/**
 * Repo to pull the changelog from, set as `github_repo` in product metadata.
 * Accepts "owner/repo" or a full GitHub URL. Returns null when not configured.
 */
export function getProductGithubRepo(metadata: ProductMetadata) {
  return getStringFromProductMetadata(metadata, "github_repo");
}
