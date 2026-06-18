// Shared homepage layout model: types, defaults and defensive normalization.
// Intentionally free of server-only imports so the admin builder (client),
// the save action (server) and the home renderers (server) can all import it.

export const HOME_LAYOUT_KEY = "home.layout";

export type SectionType =
  | "hero"
  | "featured_products"
  | "categories"
  | "keywords"
  | "flash_sale"
  | "banner_grid";

export type CtaConfig = { label: string; href: string };

export type ColumnCount = 2 | 3 | 4;

export type HeroSection = {
  id: string;
  type: "hero";
  enabled: boolean;
  variant: "split" | "centered" | "minimal";
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: CtaConfig;
  secondaryCta: CtaConfig;
  showSpotlight: boolean;
  signals: { title: string; description: string }[];
};

export type FeaturedProductsSection = {
  id: string;
  type: "featured_products";
  enabled: boolean;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  source: "latest" | "category";
  categorySlug: string;
  limit: number;
  layout: "grid" | "row";
  columns: ColumnCount;
};

export type CategoriesSection = {
  id: string;
  type: "categories";
  enabled: boolean;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  source: "all" | "selected";
  categoryIds: string[];
  layout: "grid" | "row";
  columns: ColumnCount;
};

export type KeywordItem = { label: string; href: string };

export type KeywordsSection = {
  id: string;
  type: "keywords";
  enabled: boolean;
  title: string;
  description: string;
  items: KeywordItem[];
};

export type FlashSaleSection = {
  id: string;
  type: "flash_sale";
  enabled: boolean;
  title: string;
  // ISO datetime the countdown targets. Section auto-hides once it passes.
  endsAt: string;
  actionLabel: string;
  actionHref: string;
  limit: number;
};

export type BannerItem = { imageUrl: string; href: string; title: string };

export type BannerGridSection = {
  id: string;
  type: "banner_grid";
  enabled: boolean;
  items: BannerItem[];
};

export type HomeSection =
  | HeroSection
  | FeaturedProductsSection
  | CategoriesSection
  | KeywordsSection
  | FlashSaleSection
  | BannerGridSection;

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  featured_products: "Sản phẩm nổi bật",
  categories: "Danh mục",
  keywords: "Từ khóa nổi bật",
  flash_sale: "Flash Sale",
  banner_grid: "Lưới banner",
};

export const SECTION_TYPES: SectionType[] = [
  "hero",
  "banner_grid",
  "flash_sale",
  "featured_products",
  "categories",
  "keywords",
];

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `sec_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// Factory for a fresh section of a given type, pre-filled with sensible copy.
export function createSection(type: SectionType): HomeSection {
  switch (type) {
    case "hero":
      return {
        id: newId(),
        type: "hero",
        enabled: true,
        variant: "split",
        eyebrow: "DanCruShop for builders",
        title: "Tools, source code, and AI resources to ship faster.",
        subtitle:
          "Browse the catalog, know exactly what to buy, and get your resources neatly in your account after checkout.",
        primaryCta: { label: "Browse products", href: "/products" },
        secondaryCta: { label: "Explore tools", href: "/products" },
        showSpotlight: true,
        signals: [
          {
            title: "AI tools & accounts",
            description:
              "Resources for coding workflows, automation, and AI builders.",
          },
          {
            title: "Ready-to-use source code",
            description: "Starter kits, templates, and mini tools to ship faster.",
          },
          {
            title: "Instant delivery after checkout",
            description:
              "Get files, download links, or access right in your account.",
          },
        ],
      };
    case "featured_products":
      return {
        id: newId(),
        type: "featured_products",
        enabled: true,
        title: "Featured products",
        description:
          "Resources on sale right now, prioritizing those with clear descriptions, clear pricing, and fast delivery.",
        actionLabel: "View all",
        actionHref: "/products",
        source: "latest",
        categorySlug: "",
        limit: 6,
        layout: "grid",
        columns: 3,
      };
    case "categories":
      return {
        id: newId(),
        type: "categories",
        enabled: true,
        title: "Shop by category",
        description:
          "Quickly find the type of resource you need and head straight to the catalog.",
        actionLabel: "Open catalog",
        actionHref: "/products",
        source: "all",
        categoryIds: [],
        layout: "grid",
        columns: 3,
      };
    case "keywords":
      return {
        id: newId(),
        type: "keywords",
        enabled: true,
        title: "Popular keywords",
        description: "Tap to jump straight to the products you're looking for.",
        items: [
          { label: "AI tools", href: "/products?q=AI" },
          { label: "Business", href: "/products?q=business" },
          { label: "Entertainment", href: "/products?q=entertainment" },
          { label: "Learning", href: "/products?q=learning" },
          { label: "Design", href: "/products?q=design" },
          { label: "Security", href: "/products?q=security" },
        ],
      };
    case "flash_sale":
      return {
        id: newId(),
        type: "flash_sale",
        enabled: true,
        title: "Flash Sale",
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        actionLabel: "View all",
        actionHref: "/products",
        limit: 5,
      };
    case "banner_grid":
      return {
        id: newId(),
        type: "banner_grid",
        enabled: true,
        items: [],
      };
  }
}

export const DEFAULT_LAYOUT: HomeSection[] = [
  createSection("hero"),
  createSection("featured_products"),
  createSection("categories"),
];

// ---- defensive coercion ----

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asColumns(value: unknown, fallback: ColumnCount): ColumnCount {
  return value === 2 || value === 3 || value === 4 ? value : fallback;
}

function asCta(value: unknown, fallback: CtaConfig): CtaConfig {
  const record = (value ?? {}) as Record<string, unknown>;
  return {
    label: asString(record.label, fallback.label),
    href: asString(record.href, fallback.href),
  };
}

function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function normalizeSection(value: unknown): HomeSection | null {
  const record = (value ?? {}) as Record<string, unknown>;
  const type = record.type;

  if (
    type !== "hero" &&
    type !== "featured_products" &&
    type !== "categories" &&
    type !== "keywords" &&
    type !== "flash_sale" &&
    type !== "banner_grid"
  ) {
    return null;
  }

  const base = createSection(type);
  const id = asString(record.id, base.id);
  const enabled = asBool(record.enabled, base.enabled);

  if (base.type === "hero") {
    const signals = Array.isArray(record.signals)
      ? record.signals.map((item) => {
          const r = (item ?? {}) as Record<string, unknown>;
          return {
            title: asString(r.title, ""),
            description: asString(r.description, ""),
          };
        })
      : base.signals;

    return {
      ...base,
      id,
      enabled,
      variant: asEnum(record.variant, ["split", "centered", "minimal"], base.variant),
      eyebrow: asString(record.eyebrow, base.eyebrow),
      title: asString(record.title, base.title),
      subtitle: asString(record.subtitle, base.subtitle),
      primaryCta: asCta(record.primaryCta, base.primaryCta),
      secondaryCta: asCta(record.secondaryCta, base.secondaryCta),
      showSpotlight: asBool(record.showSpotlight, base.showSpotlight),
      signals,
    };
  }

  if (base.type === "keywords") {
    const items = Array.isArray(record.items)
      ? record.items
          .map((item) => {
            const r = (item ?? {}) as Record<string, unknown>;
            return {
              label: asString(r.label, ""),
              href: asString(r.href, ""),
            };
          })
          .filter((item) => item.label.length > 0)
      : base.items;

    return {
      ...base,
      id,
      enabled,
      title: asString(record.title, base.title),
      description: asString(record.description, base.description),
      items,
    };
  }

  if (base.type === "flash_sale") {
    const rawLimit = Number(record.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(12, Math.max(1, Math.trunc(rawLimit)))
      : base.limit;

    return {
      ...base,
      id,
      enabled,
      title: asString(record.title, base.title),
      endsAt: asString(record.endsAt, base.endsAt),
      actionLabel: asString(record.actionLabel, base.actionLabel),
      actionHref: asString(record.actionHref, base.actionHref),
      limit,
    };
  }

  if (base.type === "banner_grid") {
    const items = Array.isArray(record.items)
      ? record.items
          .map((item) => {
            const r = (item ?? {}) as Record<string, unknown>;
            return {
              imageUrl: asString(r.imageUrl, ""),
              href: asString(r.href, ""),
              title: asString(r.title, ""),
            };
          })
          .filter((item) => item.imageUrl.length > 0)
      : base.items;

    return {
      ...base,
      id,
      enabled,
      items,
    };
  }

  if (base.type === "featured_products") {
    const rawLimit = Number(record.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(12, Math.max(1, Math.trunc(rawLimit)))
      : base.limit;

    return {
      ...base,
      id,
      enabled,
      title: asString(record.title, base.title),
      description: asString(record.description, base.description),
      actionLabel: asString(record.actionLabel, base.actionLabel),
      actionHref: asString(record.actionHref, base.actionHref),
      source: asEnum(record.source, ["latest", "category"], base.source),
      categorySlug: asString(record.categorySlug, base.categorySlug),
      limit,
      layout: asEnum(record.layout, ["grid", "row"], base.layout),
      columns: asColumns(record.columns, base.columns),
    };
  }

  const categoryIds = Array.isArray(record.categoryIds)
    ? record.categoryIds.filter((id): id is string => typeof id === "string")
    : base.categoryIds;

  return {
    ...base,
    id,
    enabled,
    title: asString(record.title, base.title),
    description: asString(record.description, base.description),
    actionLabel: asString(record.actionLabel, base.actionLabel),
    actionHref: asString(record.actionHref, base.actionHref),
    source: asEnum(record.source, ["all", "selected"], base.source),
    categoryIds,
    layout: asEnum(record.layout, ["grid", "row"], base.layout),
    columns: asColumns(record.columns, base.columns),
  };
}

/**
 * Coerces an arbitrary stored value into a renderable layout array. Returns the
 * default layout when the value is missing or not a non-empty array.
 */
export function normalizeLayout(value: unknown): HomeSection[] {
  if (!Array.isArray(value)) {
    return DEFAULT_LAYOUT;
  }

  const sections = value
    .map(normalizeSection)
    .filter((section): section is HomeSection => section !== null);

  return sections.length > 0 ? sections : DEFAULT_LAYOUT;
}
