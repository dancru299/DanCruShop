import { absoluteUrl, getSiteUrl, siteName } from "@/lib/site-config";

export type JsonLdObject = Record<string, unknown>;

export function buildOrganizationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    logo: absoluteUrl("/logo-mark.svg"),
    name: siteName,
    url: getSiteUrl(),
  };
}

export function buildWebsiteJsonLd(): JsonLdObject {
  const base = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    potentialAction: {
      "@type": "SearchAction",
      "query-input": "required name=search_term_string",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/products?q={search_term_string}`,
      },
    },
    url: base,
  };
}

type ProductJsonLdInput = {
  name: string;
  description: string;
  slug: string;
  image?: string | null;
  priceCents: number;
  currency: string;
  isFree: boolean;
  category?: string;
  rating?: { value: number; count: number } | null;
};

function toMajorUnits(priceCents: number, currency: string) {
  return currency.toUpperCase() === "VND" ? priceCents : priceCents / 100;
}

export function buildProductJsonLd(input: ProductJsonLdInput): JsonLdObject {
  const url = absoluteUrl(`/products/${input.slug}`);
  const price = input.isFree
    ? 0
    : toMajorUnits(input.priceCents, input.currency);

  const data: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Product",
    brand: { "@type": "Brand", name: siteName },
    description: input.description,
    name: input.name,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: price.toString(),
      priceCurrency: input.currency.toUpperCase(),
      url,
    },
    url,
    ...(input.image ? { image: input.image } : {}),
    ...(input.category ? { category: input.category } : {}),
  };

  if (input.rating && input.rating.count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      bestRating: 5,
      ratingValue: input.rating.value,
      reviewCount: input.rating.count,
      worstRating: 1,
    };
  }

  return data;
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[]
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: absoluteUrl(item.path),
      name: item.name,
      position: index + 1,
    })),
  };
}

type ArticleJsonLdInput = {
  title: string;
  description: string;
  slug: string;
  image?: string | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
};

export function buildArticleJsonLd(input: ArticleJsonLdInput): JsonLdObject {
  const url = absoluteUrl(`/blog/${input.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    description: input.description,
    headline: input.title,
    mainEntityOfPage: url,
    publisher: {
      "@type": "Organization",
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo-mark.svg") },
      name: siteName,
    },
    url,
    ...(input.image ? { image: input.image } : {}),
    ...(input.publishedTime ? { datePublished: input.publishedTime } : {}),
    ...(input.modifiedTime ? { dateModified: input.modifiedTime } : {}),
  };
}
